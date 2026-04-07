import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { analizarTextoJuridico, mapearModelosIA } from '../groqClient';

function RichEditor({ value, onChange, readOnly }) {
  const ref = useRef(null);
  const exec = cmd => { document.execCommand(cmd, false, null); };
  const toUpper = () => {
    const sel = window.getSelection();
    if (sel?.toString()) document.execCommand('insertText', false, sel.toString().toUpperCase());
  };

  return (
    <div style={{ border: '1px solid var(--bdr)', borderRadius: 10, overflow: 'hidden' }}>
      {!readOnly && (
        <div style={{
          display: 'flex', gap: 4, padding: '6px 10px',
          borderBottom: '1px solid var(--bdr)',
          background: 'var(--s1)', flexWrap: 'wrap'
        }}>
          {[
            { l: 'B', cmd: 'bold',      s: { fontWeight: 700 } },
            { l: 'I', cmd: 'italic',    s: { fontStyle: 'italic' } },
            { l: 'U', cmd: 'underline', s: { textDecoration: 'underline' } },
          ].map(t => (
            <button
              key={t.cmd}
              onMouseDown={e => { e.preventDefault(); exec(t.cmd); }}
              style={{
                width: 26, height: 26, borderRadius: 5,
                border: '1px solid var(--bdr)',
                background: 'var(--s2)', color: 'var(--txt)',
                cursor: 'pointer', fontSize: 12, ...t.s
              }}
            >{t.l}</button>
          ))}
          <button
            onMouseDown={e => { e.preventDefault(); toUpper(); }}
            style={{
              padding: '0 8px', height: 26, borderRadius: 5,
              border: '1px solid var(--bdr)',
              background: 'var(--s2)', color: 'var(--txt)',
              cursor: 'pointer', fontSize: 10, fontWeight: 700
            }}
          >AA</button>
          <div style={{ width: 1, height: 20, background: 'var(--bdr)', margin: '3px 2px' }} />
          <button
            onMouseDown={e => { e.preventDefault(); exec('justifyFull'); }}
            style={{
              padding: '0 8px', height: 26, borderRadius: 5,
              border: '1px solid var(--bdr)',
              background: 'var(--s2)', color: 'var(--txt-mid)',
              cursor: 'pointer', fontSize: 10
            }}
          >Just</button>
          <button
            onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }}
            style={{
              padding: '0 8px', height: 26, borderRadius: 5,
              border: '1px solid var(--bdr)',
              background: 'var(--s2)', color: 'var(--txt-mid)',
              cursor: 'pointer', fontSize: 10
            }}
          >Izq</button>
        </div>
      )}
      <div
        ref={ref}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={e => onChange && onChange(e.currentTarget.innerHTML)}
        style={{
          padding: '14px 18px', minHeight: 130,
          color: 'var(--txt)', fontSize: 13,
          lineHeight: 1.85, outline: 'none',
          fontFamily: "'Georgia', serif",
          background: 'var(--s2)'
        }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}

function renderTexto(texto) {
  if (!texto) return null;
  const plain = texto.replace(/<[^>]+>/g, '');
  const parts = plain.split(/(\[[A-Z_]+\])/g);
  return parts.map((p, i) =>
    p.match(/^\[[A-Z_]+\]$/) ? (
      <span key={i} style={{
        background: 'var(--blue-bg)', color: 'var(--blue)',
        borderRadius: 4, padding: '0 4px', fontSize: 11,
        fontFamily: "'DM Mono', monospace",
        border: '1px solid rgba(96,165,250,.3)'
      }}>{p}</span>
    ) : <span key={i}>{p}</span>
  );
}

function resColor(nombre) {
  if (!nombre) return 'var(--txt-mid)';
  if (nombre.includes('Positiv') || nombre === 'Si paga') return 'var(--green)';
  if (nombre.includes('Negativ') || nombre === 'No paga') return 'var(--red)';
  if (nombre.includes('Frustrad')) return 'var(--amber)';
  return 'var(--blue)';
}

const VARIABLES_COMUNES = [
  'NOMBRE_DEMANDADO', 'RUT_DEMANDADO', 'DOMICILIO', 'COMUNA',
  'FECHA_LETRAS', 'HORA_LETRAS', 'NOMBRE_INFORMANTE',
  'NUEVO_DOMICILIO', 'FECHA_FALLECIMIENTO', 'BIENES',
  'MONTO_LETRAS', 'NOMBRE_RECEPTOR',
];

export default function Modelos() {
  const [resultados, setResultados]     = useState([]);
  const [tipos, setTipos]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [sel, setSel]                   = useState(null);
  const [body, setBody]                 = useState('');
  const [variables, setVariables]       = useState([]);
  const [guardando, setGuardando]       = useState(false);
  const [guardadoOk, setGuardadoOk]     = useState(false);
  const [tipoFiltro, setTipoFiltro]     = useState('Todos');
  const [resFiltro, setResFiltro]       = useState('Todos');
  const [showImport, setShowImport]     = useState(false);
  const [importando, setImportando]     = useState(false);
  const [propuestaIA, setPropuestaIA]   = useState(null);
  const [textoImport, setTextoImport]   = useState('');
  const [showNuevo, setShowNuevo]       = useState(false);
  const [nuevoRes, setNuevoRes]         = useState({ nombre: '', subtipo: '', tipo_gestion: '' });
  const [analizando, setAnalizando]     = useState(false);
  const [sugerencias, setSugerencias]   = useState([]);

  const cargar = async () => {
    setLoading(true);
    const [{ data: res }, { data: tip }] = await Promise.all([
      supabase.from('resultados_gestion').select('*').eq('activo', true).order('nombre'),
      supabase.from('tipos_gestion').select('*').eq('activo', true).order('nombre'),
    ]);
    setResultados(res || []);
    setTipos(tip || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  // --- Jerarquía Tipo → Resultado → Modelo ---
  const tiposUnicos = ['Todos', ...tipos.map(t => t.nombre)];
  const sinTipo = resultados.filter(r => !r.tipo_gestion);

  const filtradosPorTipo = tipoFiltro === 'Todos'
    ? resultados
    : resultados.filter(r => r.tipo_gestion === tipoFiltro);

  const resultadosUnicos = ['Todos', ...new Set(filtradosPorTipo.map(r => r.nombre))];
  const filtrados = resFiltro === 'Todos'
    ? filtradosPorTipo
    : filtradosPorTipo.filter(r => r.nombre === resFiltro);

  // Agrupar por resultado para la lista
  const grupos = {};
  filtrados.forEach(r => {
    const key = r.nombre || 'Sin resultado';
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(r);
  });

  // Stats
  const totalModelos = resultados.length;
  const sinTexto = resultados.filter(r => !r.modelo_texto).length;
  const conTipo = resultados.filter(r => r.tipo_gestion).length;

  const abrirModelo = r => {
    setSel(r);
    setBody(r.modelo_texto || '');
    setVariables(r.variables || []);
    setGuardadoOk(false);
    setSugerencias([]);
  };

  const guardarModelo = async () => {
    if (!sel) return;
    setGuardando(true);
    const { error } = await supabase
      .from('resultados_gestion')
      .update({
        nombre:       sel.nombre,
        subtipo:      sel.subtipo,
        tipo_gestion: sel.tipo_gestion || null,
        modelo_texto: body,
        variables:    variables,
      })
      .eq('id', sel.id);
    if (!error) {
      setGuardadoOk(true);
      setTimeout(() => setGuardadoOk(false), 2000);
      cargar();
    }
    setGuardando(false);
  };

  const agregarVariable = v => {
    if (!variables.includes(v)) setVariables(p => [...p, v]);
    document.execCommand('insertText', false, ` [${v}]`);
  };

  const eliminarVariable = v => setVariables(p => p.filter(x => x !== v));

  const agregarResultado = async () => {
    if (!nuevoRes.nombre.trim() || !nuevoRes.tipo_gestion) return;
    await supabase.from('resultados_gestion').insert([{
      nombre:       nuevoRes.nombre.trim(),
      subtipo:      nuevoRes.subtipo?.trim() || null,
      tipo_gestion: nuevoRes.tipo_gestion,
      modelo_texto: '',
      variables:    [],
      activo:       true,
    }]);
    setNuevoRes({ nombre: '', subtipo: '', tipo_gestion: '' });
    setShowNuevo(false);
    cargar();
  };

  const eliminarResultado = async id => {
    if (!window.confirm('Eliminar este modelo?')) return;
    await supabase.from('resultados_gestion').update({ activo: false }).eq('id', id);
    if (sel?.id === id) setSel(null);
    cargar();
  };

  // ── IA real con Groq ───────────────────────────────────────────────────────
  const solicitarMejoraIA = async () => {
    if (!body) return;
    setAnalizando(true);
    setSugerencias([]);
    try {
      const textoLimpio = body.replace(/<[^>]+>/g, '');
      const resultado = await analizarTextoJuridico(textoLimpio);
      if (resultado.sugerencias?.length > 0) {
        setSugerencias(resultado.sugerencias);
      } else {
        setSugerencias([{
          esSinCambios: true,
          razon: `\u2713 ${resultado.evaluacion || 'El texto ya tiene una redacci\u00f3n jur\u00eddicamente correcta.'}`
        }]);
      }
    } catch (e) {
      console.error(e);
      alert('Error al conectar con la IA.');
    }
    setAnalizando(false);
  };

  const aceptarSugerencia = (idx, s) => {
    if (s.esSinCambios) { setSugerencias([]); return; }
    setBody(prev => prev.replace(s.original, s.sugerido));
    setSugerencias(prev => prev.filter((_, i) => i !== idx));
  };

  const rechazarSugerencia = idx => {
    setSugerencias(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Importar con IA ─────────────────────────────────────────────────────
  const analizarTextoImport = async () => {
    if (!textoImport.trim()) return;
    setImportando(true);
    try {
      const resultado = await mapearModelosIA(textoImport);
      if (resultado.modelos?.length > 0) {
        setPropuestaIA(resultado.modelos.map(m => ({
          ...m,
          tipo_gestion: tipoFiltro !== 'Todos' ? tipoFiltro : '',
          esNuevo: !resultados.find(r =>
            r.nombre === m.nombre && r.subtipo === m.subtipo
          )
        })));
      } else {
        alert('La IA no detect\u00f3 modelos. Intenta con m\u00e1s texto o con un formato m\u00e1s claro.');
      }
    } catch (e) {
      console.error(e);
      alert('Error al analizar: ' + e.message);
    }
    setImportando(false);
  };

  const aceptarPropuestaIA = async items => {
    for (const p of items) {
      const existente = resultados.find(r =>
        r.nombre === p.nombre && r.subtipo === p.subtipo
      );
      if (existente) {
        await supabase.from('resultados_gestion').update({
          modelo_texto:  p.modelo_texto,
          variables:     p.variables,
          tipo_gestion:  p.tipo_gestion || existente.tipo_gestion || null,
        }).eq('id', existente.id);
      } else {
        await supabase.from('resultados_gestion').insert([{
          nombre:       p.nombre,
          subtipo:      p.subtipo,
          tipo_gestion: p.tipo_gestion || null,
          modelo_texto: p.modelo_texto,
          variables:    p.variables,
          activo:       true,
        }]);
      }
    }
    setPropuestaIA(null);
    setShowImport(false);
    setTextoImport('');
    cargar();
  };

  return (
    <div>
      {/* Header */}
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>
            Biblioteca de Estampes
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginTop: 2 }}>
            {totalModelos} modelos en {tipos.length} tipos de gesti\u00f3n
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setShowImport(!showImport); setPropuestaIA(null); setTextoImport(''); }}
        >IA Importar</button>
        <button className="btn btn-gold" onClick={() => setShowNuevo(!showNuevo)}>
          {showNuevo ? '\u2715 Cancelar' : '+ Nuevo modelo'}
        </button>
      </div>

      {/* Stats */}
      <div className="g3" style={{ marginBottom: 14 }}>
        <div className="statcard">
          <div className="sl">Total modelos</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{totalModelos}</div>
        </div>
        <div className="statcard">
          <div className="sl">Con tipo asignado</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{conTipo}</div>
          {sinTipo.length > 0 && <div style={{ fontSize: 10, color: 'var(--amber)' }}>{sinTipo.length} sin tipo</div>}
        </div>
        <div className="statcard">
          <div className="sl">Sin texto modelo</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: sinTexto > 0 ? 'var(--amber)' : 'var(--green)' }}>{sinTexto}</div>
        </div>
      </div>

      {/* Nuevo resultado */}
      {showNuevo && (
        <div className="card card-p" style={{ marginBottom: 14 }}>
          <div className="sl" style={{ marginBottom: 8 }}>Nuevo modelo de estampe</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10 }}>
            <div>
              <div className="sl" style={{ marginBottom: 4 }}>Tipo de gesti\u00f3n *</div>
              <select
                value={nuevoRes.tipo_gestion}
                onChange={e => setNuevoRes(p => ({ ...p, tipo_gestion: e.target.value }))}
                style={{ width: '100%' }}
              >
                <option value="">Seleccionar tipo...</option>
                {tipos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <div className="sl" style={{ marginBottom: 4 }}>Resultado *</div>
              <input
                placeholder="Positiva, Negativa..."
                value={nuevoRes.nombre}
                onChange={e => setNuevoRes(p => ({ ...p, nombre: e.target.value }))}
                list="lista-res"
              />
              <datalist id="lista-res">
                {['Positiva','Positivo','Negativa','Negativo','Frustrado','Frustrada','Si paga','No paga','Oposici\u00f3n','Alzamiento','Certificaci\u00f3n'].map(r => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div>
              <div className="sl" style={{ marginBottom: 4 }}>Subtipo</div>
              <input
                placeholder="Ej: Art. 44, No vive ah\u00ed..."
                value={nuevoRes.subtipo}
                onChange={e => setNuevoRes(p => ({ ...p, subtipo: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && agregarResultado()}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-gold" onClick={agregarResultado} disabled={!nuevoRes.tipo_gestion || !nuevoRes.nombre.trim()}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* Importador IA */}
      {showImport && (
        <div className="card card-p" style={{ marginBottom: 14, border: '1px solid rgba(96,165,250,.3)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', marginBottom: 6 }}>
            IA Importar modelos
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 14 }}>
            Pega el texto de tus modelos de estampe. La IA detecta resultado, subtipo, variables y texto.
            {tipoFiltro !== 'Todos' && <span style={{ color: 'var(--gold)', fontWeight: 600 }}> Se asignar\u00e1n al tipo: {tipoFiltro}</span>}
          </div>

          {!propuestaIA && !importando && (
            <div>
              <textarea
                value={textoImport}
                onChange={e => setTextoImport(e.target.value)}
                placeholder={`Pega aqu\u00ed el texto de tus modelos de estampe...\n\nEjemplo:\nCERTIFICO: Haberme constituido en el domicilio se\u00f1alado en autos, a fin de notificar a [NOMBRE_DEMANDADO], RUT [RUT_DEMANDADO]. Se notific\u00f3 personalmente. Doy fe.`}
                style={{
                  width: '100%', minHeight: 200,
                  background: 'var(--s2)',
                  border: '1px solid var(--bdr)',
                  borderRadius: 8, padding: '12px 14px',
                  color: 'var(--txt)', fontSize: 12,
                  fontFamily: "'Georgia', serif",
                  lineHeight: 1.8, outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box'
                }}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file && file.name.endsWith('.txt')) {
                    const reader = new FileReader();
                    reader.onload = ev => setTextoImport(ev.target.result);
                    reader.readAsText(file);
                  }
                }}
                onDragOver={e => e.preventDefault()}
              />
              <div className="row" style={{ gap: 8, marginTop: 10 }}>
                <button
                  className="btn btn-gold"
                  style={{ padding: '9px 20px' }}
                  onClick={analizarTextoImport}
                  disabled={!textoImport.trim()}
                >IA Analizar</button>
                <button className="btn btn-ghost" onClick={() => { setShowImport(false); setTextoImport(''); }}>
                  Cancelar
                </button>
                <span style={{ fontSize: 10, color: 'var(--txt-lo)' }}>
                  Arrastra un archivo .txt al \u00e1rea de texto
                </span>
              </div>
            </div>
          )}

          {importando && (
            <div style={{ textAlign: 'center', padding: 28 }}>
              <span className="spin" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>*</span>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', marginBottom: 4 }}>
                Analizando con IA...
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-mid)' }}>
                Detectando resultados, subtipos y variables
              </div>
            </div>
          )}

          {propuestaIA && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 12 }}>
                IA detect\u00f3 {propuestaIA.length} modelos
              </div>
              {propuestaIA.map((p, i) => (
                <div key={i} style={{
                  background: 'var(--s2)', borderRadius: 10,
                  border: `1px solid ${p.esNuevo ? 'rgba(96,165,250,.4)' : 'var(--bdr)'}`,
                  padding: 14, marginBottom: 10
                }}>
                  <div className="row" style={{ marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div className="row" style={{ gap: 6 }}>
                      <span style={{
                        padding: '2px 9px', borderRadius: 5, fontSize: 11, fontWeight: 700,
                        color: resColor(p.nombre), background: resColor(p.nombre) + '18',
                      }}>{p.nombre}</span>
                      {p.subtipo && <span style={{ fontSize: 12, color: 'var(--txt)' }}>\u2192 {p.subtipo}</span>}
                      {p.esNuevo && <span className="tag" style={{ color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid rgba(96,165,250,.3)' }}>Nuevo</span>}
                    </div>
                    <span style={{
                      marginLeft: 'auto', padding: '2px 8px', borderRadius: 4,
                      fontSize: 10, fontWeight: 700,
                      color: p.confianza >= 90 ? 'var(--green)' : p.confianza >= 75 ? 'var(--amber)' : 'var(--red)',
                      background: (p.confianza >= 90 ? 'var(--green)' : p.confianza >= 75 ? 'var(--amber)' : 'var(--red)') + '18',
                    }}>{p.confianza}%</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <div>
                      <div className="sl" style={{ marginBottom: 4 }}>Tipo gesti\u00f3n</div>
                      <select value={p.tipo_gestion || ''} onChange={e => setPropuestaIA(prev => prev.map((x, j) => j === i ? { ...x, tipo_gestion: e.target.value } : x))} style={{ fontSize: 11, width: '100%' }}>
                        <option value="">Sin tipo</option>
                        {tipos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="sl" style={{ marginBottom: 4 }}>Resultado</div>
                      <input value={p.nombre} onChange={e => setPropuestaIA(prev => prev.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))} style={{ fontSize: 11 }} />
                    </div>
                    <div>
                      <div className="sl" style={{ marginBottom: 4 }}>Subtipo</div>
                      <input value={p.subtipo || ''} onChange={e => setPropuestaIA(prev => prev.map((x, j) => j === i ? { ...x, subtipo: e.target.value } : x))} style={{ fontSize: 11 }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div className="sl" style={{ marginBottom: 5 }}>Variables detectadas</div>
                    <div className="row" style={{ gap: 5, flexWrap: 'wrap' }}>
                      {p.variables?.map(v => (
                        <span key={v} style={{ fontSize: 10, color: 'var(--blue)', background: 'var(--blue-bg)', padding: '2px 8px', borderRadius: 4, fontFamily: "'DM Mono', monospace", border: '1px solid rgba(96,165,250,.3)' }}>[{v}]</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="sl" style={{ marginBottom: 5 }}>Texto del modelo</div>
                    <div style={{ background: 'var(--s1)', borderRadius: 8, padding: '10px 14px', fontSize: 12, lineHeight: 1.8, color: 'var(--txt)', fontFamily: "'Georgia', serif", border: '1px solid var(--bdr)' }}
                      dangerouslySetInnerHTML={{ __html: p.modelo_texto }}
                    />
                  </div>
                </div>
              ))}
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <button className="btn btn-gold" style={{ padding: '9px 20px', fontSize: 13 }} onClick={() => aceptarPropuestaIA(propuestaIA)}>
                  Aceptar e importar
                </button>
                <button className="btn btn-ghost" onClick={() => { setPropuestaIA(null); setTextoImport(''); }}>Volver</button>
                <button className="btn btn-ghost" onClick={() => { setPropuestaIA(null); setShowImport(false); setTextoImport(''); }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Nivel 1: Filtro por Tipo de Gesti\u00f3n ── */}
      <div style={{ marginBottom: 6 }}>
        <div className="sl" style={{ marginBottom: 6 }}>Tipo de gesti\u00f3n</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
          {tiposUnicos.map(t => (
            <button
              key={t}
              className="btn btn-ghost btn-sm"
              style={tipoFiltro === t ? {
                borderColor: 'var(--gold)',
                color: 'var(--gold)',
                background: 'var(--gold)' + '15',
              } : {}}
              onClick={() => { setTipoFiltro(t); setResFiltro('Todos'); setSel(null); }}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* ── Nivel 2: Filtro por Resultado ── */}
      <div style={{ marginBottom: 14 }}>
        <div className="sl" style={{ marginBottom: 6 }}>Resultado</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
          {resultadosUnicos.map(c => (
            <button
              key={c}
              className="btn btn-ghost btn-sm"
              style={resFiltro === c ? {
                borderColor: resColor(c) === 'var(--txt-mid)' ? 'var(--gold)' : resColor(c),
                color:       resColor(c) === 'var(--txt-mid)' ? 'var(--gold)' : resColor(c),
                background:  (resColor(c) === 'var(--txt-mid)' ? 'var(--gold)' : resColor(c)) + '15',
              } : {}}
              onClick={() => setResFiltro(c)}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* ── Nivel 3: Grid lista + panel ── */}
      <div style={{ display: 'grid', gridTemplateColumns: sel ? '320px 1fr' : '1fr', gap: 14 }}>

        {/* Lista agrupada por resultado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--txt-mid)' }}>
              <span className="spin" style={{ fontSize: 24 }}>*</span>
            </div>
          ) : Object.keys(grupos).length > 0 ? (
            Object.entries(grupos).map(([resNombre, items]) => (
              <div key={resNombre}>
                <div className="row" style={{ gap: 6, marginBottom: 6 }}>
                  <span style={{
                    padding: '2px 10px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                    color: resColor(resNombre), background: resColor(resNombre) + '18',
                  }}>{resNombre}</span>
                  <span style={{ fontSize: 10, color: 'var(--txt-lo)' }}>{items.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {items.map(r => (
                    <div
                      key={r.id}
                      onClick={() => abrirModelo(r)}
                      style={{
                        background:   sel?.id === r.id ? 'var(--s2)' : 'var(--s1)',
                        border:       `1.5px solid ${sel?.id === r.id ? 'var(--gold)' : 'var(--bdr)'}`,
                        borderLeft:   `3px solid ${resColor(r.nombre)}`,
                        borderRadius: 11, padding: 13, cursor: 'pointer',
                        transition:   'all .15s'
                      }}
                    >
                      <div className="row" style={{ gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                        {r.tipo_gestion && (
                          <span style={{ fontSize: 9, color: 'var(--gold)', fontWeight: 700, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>{r.tipo_gestion}</span>
                        )}
                        {r.subtipo && (
                          <span style={{ fontSize: 11, color: 'var(--txt)', fontWeight: 600 }}>{r.subtipo}</span>
                        )}
                      </div>
                      {r.variables?.length > 0 && (
                        <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {r.variables.slice(0, 3).map(v => (
                            <span key={v} style={{ fontSize: 8, color: 'var(--blue)', background: 'var(--blue-bg)', padding: '1px 5px', borderRadius: 3, fontFamily: "'DM Mono', monospace" }}>{v}</span>
                          ))}
                          {r.variables.length > 3 && <span style={{ fontSize: 8, color: 'var(--txt-lo)' }}>+{r.variables.length - 3}</span>}
                        </div>
                      )}
                      {!r.modelo_texto && (
                        <div style={{ fontSize: 9, color: 'var(--amber)', marginTop: 5 }}>Sin texto modelo</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--txt-mid)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>&#9878;</div>
              <div>No hay modelos en esta selecci\u00f3n</div>
            </div>
          )}
        </div>

        {/* Panel edici\u00f3n */}
        {sel && (
          <div className="card card-p">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div className="row" style={{ gap: 7, marginBottom: 4 }}>
                  {sel.tipo_gestion && (
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                      color: 'var(--gold)', background: 'var(--gold-bg)',
                      border: '1px solid rgba(201,168,76,.3)',
                      fontFamily: "'DM Mono', monospace", textTransform: 'uppercase'
                    }}>{sel.tipo_gestion}</span>
                  )}
                  <span style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                    color: resColor(sel.nombre), background: resColor(sel.nombre) + '18',
                  }}>{sel.nombre}</span>
                  {sel.subtipo && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{sel.subtipo}</span>}
                </div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-red btn-sm" onClick={() => eliminarResultado(sel.id)}>Eliminar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setSel(null)}>\u2715</button>
              </div>
            </div>

            {/* Editar tipo / resultado / subtipo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <div className="sl" style={{ marginBottom: 4 }}>Tipo de gesti\u00f3n</div>
                <select
                  value={sel.tipo_gestion || ''}
                  onChange={e => setSel(p => ({ ...p, tipo_gestion: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="">Sin tipo</option>
                  {tipos.map(t => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                </select>
              </div>
              <div>
                <div className="sl" style={{ marginBottom: 4 }}>Resultado</div>
                <input
                  value={sel.nombre}
                  onChange={e => setSel(p => ({ ...p, nombre: e.target.value }))}
                  list="lista-res-edit"
                />
                <datalist id="lista-res-edit">
                  {['Positiva','Positivo','Negativa','Negativo','Frustrado','Frustrada','Si paga','No paga','Oposici\u00f3n','Alzamiento','Certificaci\u00f3n'].map(r => <option key={r} value={r} />)}
                </datalist>
              </div>
              <div>
                <div className="sl" style={{ marginBottom: 4 }}>Subtipo</div>
                <input
                  value={sel.subtipo || ''}
                  onChange={e => setSel(p => ({ ...p, subtipo: e.target.value }))}
                  placeholder="Ej: No vive ah\u00ed, Art. 44..."
                />
              </div>
            </div>

            {/* Variables */}
            <div style={{ marginBottom: 14 }}>
              <div className="sl" style={{ marginBottom: 8 }}>Variables del modelo</div>
              <div className="row" style={{ gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                {variables.map(v => (
                  <div key={v} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'var(--blue-bg)', padding: '3px 8px',
                    borderRadius: 5, border: '1px solid rgba(96,165,250,.3)'
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--blue)', fontFamily: "'DM Mono', monospace" }}>[{v}]</span>
                    <button onClick={() => eliminarVariable(v)} style={{ background: 'none', border: 'none', color: 'var(--txt-lo)', cursor: 'pointer', fontSize: 10 }}>\u2715</button>
                  </div>
                ))}
                {variables.length === 0 && (
                  <span style={{ fontSize: 11, color: 'var(--txt-lo)', fontStyle: 'italic' }}>Sin variables \u2014 agr\u00e9galas o escr\u00edbelas en el texto</span>
                )}
              </div>
              <div className="sl" style={{ marginBottom: 5 }}>Insertar variable</div>
              <div className="row" style={{ gap: 5, flexWrap: 'wrap' }}>
                {VARIABLES_COMUNES.filter(v => !variables.includes(v)).map(v => (
                  <button key={v} onClick={() => agregarVariable(v)} style={{ padding: '3px 9px', borderRadius: 5, border: '1px solid var(--bdr)', background: 'var(--s2)', color: 'var(--txt-mid)', fontSize: 10, cursor: 'pointer', fontFamily: "'DM Mono', monospace" }}>
                    + [{v}]
                  </button>
                ))}
              </div>
            </div>

            {/* Editor */}
            <div className="sl">Texto del modelo</div>
            <RichEditor value={body} onChange={setBody} />

            {/* Vista previa */}
            {body && (
              <div style={{ marginTop: 12 }}>
                <div className="sl" style={{ marginBottom: 6 }}>Vista previa con variables</div>
                <div style={{ background: 'var(--s2)', borderRadius: 8, padding: '12px 16px', fontSize: 12, lineHeight: 1.85, color: 'var(--txt)', fontFamily: "'Georgia', serif", border: '1px solid var(--bdr)' }}>
                  {renderTexto(body)}
                </div>
              </div>
            )}

            {/* Sugerencias IA */}
            {sugerencias.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="sl" style={{ marginBottom: 8 }}>Sugerencias IA</div>
                {sugerencias.map((s, i) => (
                  <div key={i} style={{ background: 'var(--s2)', borderRadius: 10, border: '1px solid rgba(167,139,250,.3)', padding: 14, marginBottom: 10 }}>
                    {s.esSinCambios ? (
                      <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{s.razon}</div>
                    ) : (
                      <>
                        <div style={{ fontSize: 10, color: 'var(--violet)', fontWeight: 700, letterSpacing: .8, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>SUGERENCIA IA</div>
                        <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 4 }}>
                          Actual: <span style={{ textDecoration: 'line-through', color: 'var(--red)' }}>"{s.original}"</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>\u2192 <strong>"{s.sugerido}"</strong></div>
                        <div style={{ fontSize: 10, color: 'var(--txt-mid)', fontStyle: 'italic', marginBottom: 10 }}>{s.razon}</div>
                        <div className="row" style={{ gap: 7 }}>
                          <button className="btn btn-green btn-sm" onClick={() => aceptarSugerencia(i, s)}>Aceptar</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => rechazarSugerencia(i)}>Mantener original</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Botones */}
            <div className="row" style={{ marginTop: 14, gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn btn-gold"
                style={{ padding: '9px 24px', fontSize: 13 }}
                onClick={guardarModelo}
                disabled={guardando}
              >
                {guardando ? <><span className="spin">*</span> Guardando...</> : guardadoOk ? '\u2713 Guardado' : 'Guardar modelo'}
              </button>
              <button
                className="btn btn-sm"
                style={{ background: 'var(--violet-bg)', border: '1px solid rgba(167,139,250,.3)', color: 'var(--violet)' }}
                onClick={solicitarMejoraIA}
                disabled={!body || analizando}
              >
                {analizando ? <><span className="spin">*</span> Analizando...</> : 'IA Mejorar'}
              </button>
              <button className="btn btn-ghost" onClick={() => setSel(null)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
