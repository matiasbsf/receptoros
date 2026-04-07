import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { analizarTextoJuridico, mapearModelosIA, mapearTarifasIA } from '../groqClient';

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
          >≡ Just</button>
          <button
            onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }}
            style={{
              padding: '0 8px', height: 26, borderRadius: 5,
              border: '1px solid var(--bdr)',
              background: 'var(--s2)', color: 'var(--txt-mid)',
              cursor: 'pointer', fontSize: 10
            }}
          >≡ Izq</button>
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
  const [loading, setLoading]           = useState(true);
  const [sel, setSel]                   = useState(null);
  const [body, setBody]                 = useState('');
  const [variables, setVariables]       = useState([]);
  const [guardando, setGuardando]       = useState(false);
  const [guardadoOk, setGuardadoOk]     = useState(false);
  const [filtro, setFiltro]             = useState('Todos');
  const [showImport, setShowImport]     = useState(false);
  const [importando, setImportando]     = useState(false);
  const [propuestaIA, setPropuestaIA]   = useState(null);
  const [textoImport, setTextoImport]   = useState('');
  const [showNuevo, setShowNuevo]       = useState(false);
  const [nuevoRes, setNuevoRes]         = useState({ nombre: '', subtipo: '' });
  const [analizando, setAnalizando]     = useState(false);
  const [sugerencias, setSugerencias]   = useState([]);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('resultados_gestion')
      .select('*')
      .eq('activo', true)
      .order('nombre');
    setResultados(data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const categorias = ['Todos', ...new Set(resultados.map(r => r.nombre))];
  const filtrados = filtro === 'Todos' ? resultados : resultados.filter(r => r.nombre === filtro);

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
    if (!nuevoRes.nombre.trim()) return;
    await supabase.from('resultados_gestion').insert([{
      nombre:       nuevoRes.nombre.trim(),
      subtipo:      nuevoRes.subtipo?.trim() || null,
      modelo_texto: '',
      variables:    [],
      activo:       true,
    }]);
    setNuevoRes({ nombre: '', subtipo: '' });
    setShowNuevo(false);
    cargar();
  };

  const eliminarResultado = async id => {
    if (!window.confirm('¿Eliminar este modelo?')) return;
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
          razon: `✓ ${resultado.evaluacion || 'El texto ya tiene una redacción jurídicamente correcta.'}`
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

  // ── Importar con IA — texto pegado ─────────────────────────────────────────
  const analizarTextoImport = async () => {
    if (!textoImport.trim()) return;
    setImportando(true);
    try {
      const resultado = await mapearModelosIA(textoImport);
      if (resultado.modelos?.length > 0) {
        setPropuestaIA(resultado.modelos.map(m => ({
          ...m,
          esNuevo: !resultados.find(r =>
            r.nombre === m.nombre && r.subtipo === m.subtipo
          )
        })));
      } else {
        alert('La IA no detectó modelos. Intenta con más texto o con un formato más claro.');
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
          modelo_texto: p.modelo_texto,
          variables:    p.variables,
        }).eq('id', existente.id);
      } else {
        await supabase.from('resultados_gestion').insert([{
          nombre:       p.nombre,
          subtipo:      p.subtipo,
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
            Biblioteca de Modelos
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginTop: 2 }}>
            {resultados.length} modelos · Títulos, subtipos y textos de estampe
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { setShowImport(!showImport); setPropuestaIA(null); setTextoImport(''); }}
        >🤖 Importar con IA</button>
        <button className="btn btn-gold" onClick={() => setShowNuevo(!showNuevo)}>
          {showNuevo ? '✕ Cancelar' : '+ Nuevo modelo'}
        </button>
      </div>

      {/* Nuevo resultado */}
      {showNuevo && (
        <div className="card card-p" style={{ marginBottom: 14 }}>
          <div className="sl">Nuevo resultado</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10 }}>
            <div>
              <div className="sl" style={{ marginBottom: 4 }}>Resultado *</div>
              <input
                placeholder="Positiva, Negativa, Frustrado..."
                value={nuevoRes.nombre}
                onChange={e => setNuevoRes(p => ({ ...p, nombre: e.target.value }))}
                list="lista-res"
              />
              <datalist id="lista-res">
                {['Positiva','Positivo','Negativa','Negativo','Frustrado','Frustrada','Si paga','No paga','Oposición','Alzamiento','Certificación'].map(r => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div>
              <div className="sl" style={{ marginBottom: 4 }}>Subtipo (opcional)</div>
              <input
                placeholder="Ej: No vive ahí, Art. 44..."
                value={nuevoRes.subtipo}
                onChange={e => setNuevoRes(p => ({ ...p, subtipo: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && agregarResultado()}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-gold" onClick={agregarResultado}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* Importador IA */}
      {showImport && (
        <div className="card card-p" style={{ marginBottom: 14, border: '1px solid rgba(96,165,250,.3)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', marginBottom: 6 }}>
            🤖 Importar modelos con IA
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 14 }}>
            Pega el texto de tus modelos de estampe — la IA detecta resultado, subtipo, variables y texto automáticamente.
            También puedes arrastrar un archivo <strong>.txt</strong> al área de texto.
          </div>

          {!propuestaIA && !importando && (
            <div>
              <textarea
                value={textoImport}
                onChange={e => setTextoImport(e.target.value)}
                placeholder={`Pega aquí el texto de tus modelos de estampe...

Ejemplo:
CERTIFICO: Haberme constituido en el domicilio señalado en autos, AV. PROVIDENCIA Nº 1234, PROVIDENCIA, a fin de notificar a JUAN PÉREZ LÓPEZ, RUT 12.345.678-9. Se notificó personalmente. Doy fe.

---

CERTIFICO: Haberme constituido en el domicilio señalado en autos. No fue habido. Persona adulta informó que no vive ahí. Doy fe.`}
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
                >🤖 Analizar con IA</button>
                <button className="btn btn-ghost" onClick={() => { setShowImport(false); setTextoImport(''); }}>
                  Cancelar
                </button>
                <span style={{ fontSize: 10, color: 'var(--txt-lo)' }}>
                  También puedes arrastrar un archivo .txt
                </span>
              </div>
            </div>
          )}

          {importando && (
            <div style={{ textAlign: 'center', padding: 28 }}>
              <span className="spin" style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>🤖</span>
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
                ✓ IA detectó {propuestaIA.length} modelos — revisa y confirma
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
                      {p.subtipo && <span style={{ fontSize: 12, color: 'var(--txt)' }}>→ {p.subtipo}</span>}
                      {p.esNuevo && <span className="tag" style={{ color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid rgba(96,165,250,.3)' }}>Nuevo</span>}
                    </div>
                    <span style={{
                      marginLeft: 'auto', padding: '2px 8px', borderRadius: 4,
                      fontSize: 10, fontWeight: 700,
                      color: p.confianza >= 90 ? 'var(--green)' : p.confianza >= 75 ? 'var(--amber)' : 'var(--red)',
                      background: (p.confianza >= 90 ? 'var(--green)' : p.confianza >= 75 ? 'var(--amber)' : 'var(--red)') + '18',
                    }}>{p.confianza}%</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
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
                  ✓ Aceptar e importar todos
                </button>
                <button className="btn btn-ghost" onClick={() => { setPropuestaIA(null); setTextoImport(''); }}>↺ Volver</button>
                <button className="btn btn-ghost" onClick={() => { setPropuestaIA(null); setShowImport(false); setTextoImport(''); }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
        {categorias.map(c => (
          <button
            key={c}
            className="btn btn-ghost btn-sm"
            style={filtro === c ? {
              borderColor: resColor(c) === 'var(--txt-mid)' ? 'var(--gold)' : resColor(c),
              color:       resColor(c) === 'var(--txt-mid)' ? 'var(--gold)' : resColor(c),
              background:  (resColor(c) === 'var(--txt-mid)' ? 'var(--gold)' : resColor(c)) + '15',
            } : {}}
            onClick={() => setFiltro(c)}
          >{c}</button>
        ))}
      </div>

      {/* Grid lista + panel */}
      <div style={{ display: 'grid', gridTemplateColumns: sel ? '300px 1fr' : 'repeat(2, 1fr)', gap: 14 }}>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--txt-mid)' }}>
              <span className="spin" style={{ fontSize: 24 }}>⚙</span>
            </div>
          ) : filtrados.map(r => (
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
              <div className="row" style={{ gap: 6, marginBottom: r.subtipo ? 4 : 0, flexWrap: 'wrap' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                  color: resColor(r.nombre), background: resColor(r.nombre) + '18',
                }}>{r.nombre}</span>
                {r.subtipo && (
                  <span style={{ fontSize: 11, color: 'var(--txt)', fontWeight: 600 }}>{r.subtipo}</span>
                )}
              </div>
              {r.variables?.length > 0 && (
                <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                  {r.variables.slice(0, 3).map(v => (
                    <span key={v} style={{ fontSize: 8, color: 'var(--blue)', background: 'var(--blue-bg)', padding: '1px 5px', borderRadius: 3, fontFamily: "'DM Mono', monospace" }}>{v}</span>
                  ))}
                  {r.variables.length > 3 && <span style={{ fontSize: 8, color: 'var(--txt-lo)' }}>+{r.variables.length - 3}</span>}
                </div>
              )}
              {!r.modelo_texto && (
                <div style={{ fontSize: 9, color: 'var(--amber)', marginTop: 5 }}>⚠ Sin texto modelo</div>
              )}
            </div>
          ))}
          {!loading && filtrados.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--txt-mid)' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <div>No hay modelos en esta categoría</div>
            </div>
          )}
        </div>

        {/* Panel edición */}
        {sel ? (
          <div className="card card-p">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div className="row" style={{ gap: 7, marginBottom: 4 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                    color: resColor(sel.nombre), background: resColor(sel.nombre) + '18',
                  }}>{sel.nombre}</span>
                  {sel.subtipo && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{sel.subtipo}</span>}
                </div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-red btn-sm" onClick={() => eliminarResultado(sel.id)}>🗑 Eliminar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setSel(null)}>✕</button>
              </div>
            </div>

            {/* Editar resultado/subtipo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <div className="sl" style={{ marginBottom: 4 }}>Resultado</div>
                <input
                  value={sel.nombre}
                  onChange={e => setSel(p => ({ ...p, nombre: e.target.value }))}
                  list="lista-res-edit"
                />
                <datalist id="lista-res-edit">
                  {['Positiva','Positivo','Negativa','Negativo','Frustrado','Frustrada','Si paga','No paga','Oposición','Alzamiento','Certificación'].map(r => <option key={r} value={r} />)}
                </datalist>
              </div>
              <div>
                <div className="sl" style={{ marginBottom: 4 }}>Subtipo</div>
                <input
                  value={sel.subtipo || ''}
                  onChange={e => setSel(p => ({ ...p, subtipo: e.target.value }))}
                  placeholder="Ej: No vive ahí, Art. 44..."
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
                    <button onClick={() => eliminarVariable(v)} style={{ background: 'none', border: 'none', color: 'var(--txt-lo)', cursor: 'pointer', fontSize: 10 }}>✕</button>
                  </div>
                ))}
                {variables.length === 0 && (
                  <span style={{ fontSize: 11, color: 'var(--txt-lo)', fontStyle: 'italic' }}>Sin variables — agrégalas o escríbelas en el texto</span>
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
                <div className="sl" style={{ marginBottom: 8 }}>🤖 Sugerencias de redacción</div>
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
                        <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>→ <strong>"{s.sugerido}"</strong></div>
                        <div style={{ fontSize: 10, color: 'var(--txt-mid)', fontStyle: 'italic', marginBottom: 10 }}>{s.razon}</div>
                        <div className="row" style={{ gap: 7 }}>
                          <button className="btn btn-green btn-sm" onClick={() => aceptarSugerencia(i, s)}>✓ Aceptar</button>
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
                {guardando ? <><span className="spin">⚙</span> Guardando...</> : guardadoOk ? '✓ Guardado' : 'Guardar modelo'}
              </button>
              <button
                className="btn btn-sm"
                style={{ background: 'var(--violet-bg)', border: '1px solid rgba(167,139,250,.3)', color: 'var(--violet)' }}
                onClick={solicitarMejoraIA}
                disabled={!body || analizando}
              >
                {analizando ? <><span className="spin">⚙</span> Analizando...</> : '🤖 Mejorar con IA'}
              </button>
              <button className="btn btn-ghost" onClick={() => setSel(null)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8, border: '1px dashed var(--bdr)' }}>
            <div style={{ fontSize: 36 }}>📋</div>
            <div style={{ fontSize: 13, color: 'var(--txt-mid)' }}>Selecciona un modelo para editarlo</div>
            <div style={{ fontSize: 11, color: 'var(--txt-lo)', textAlign: 'center', lineHeight: 1.5 }}>
              Las variables en <span style={{ color: 'var(--blue)', fontFamily: "'DM Mono', monospace" }}>[CORCHETES]</span> se reemplazan automáticamente con los datos de la causa
            </div>
          </div>
        )}
      </div>
    </div>
  );
}