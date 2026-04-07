import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { mapearTarifasIA } from '../groqClient';

const IVA  = 0.19;
const DIST = 0.40;

function calcular(base) {
  return {
    valor_sin_imp:      Math.round(base),
    valor_con_imp:      Math.round(base * (1 + IVA)),
    valor_dist_sin_imp: Math.round(base * (1 + DIST)),
    valor_dist_con_imp: Math.round(base * (1 + DIST) * (1 + IVA)),
  };
}

function fmt(n) { return (n || 0).toLocaleString('es-CL'); }

function TablaTarifas({ clienteId, carteraId, carteraNombre }) {
  const [tarifas, setTarifas]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editando, setEditando]     = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importando, setImportando] = useState(false);
  const [propuesta, setPropuesta]   = useState(null);
  const [textoImport, setTextoImport] = useState('');

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tarifas')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('cartera_id', carteraId)
      .order('tipo_gestion');
    setTarifas(data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [clienteId, carteraId]);

  const guardarFila = async tarifa => {
    if (tarifa.id) {
      await supabase.from('tarifas').update({
        tipo_gestion:       tarifa.tipo_gestion,
        valor_sin_imp:      tarifa.valor_sin_imp,
        valor_con_imp:      tarifa.valor_con_imp,
        valor_dist_sin_imp: tarifa.valor_dist_sin_imp,
        valor_dist_con_imp: tarifa.valor_dist_con_imp,
      }).eq('id', tarifa.id);
    } else {
      await supabase.from('tarifas').insert([{
        cliente_id:         clienteId,
        cartera_id:         carteraId,
        tipo_gestion:       tarifa.tipo_gestion,
        valor_sin_imp:      tarifa.valor_sin_imp,
        valor_con_imp:      tarifa.valor_con_imp,
        valor_dist_sin_imp: tarifa.valor_dist_sin_imp,
        valor_dist_con_imp: tarifa.valor_dist_con_imp,
      }]);
    }
    setEditando(null);
    cargar();
  };

  const eliminarFila = async id => {
    if (!window.confirm('¿Eliminar esta tarifa?')) return;
    await supabase.from('tarifas').delete().eq('id', id);
    cargar();
  };

  // ── Importar con IA — texto pegado ────────────────────────────────────────
  const analizarTextoImport = async () => {
    if (!textoImport.trim()) return;
    setImportando(true);
    try {
      const resultado = await mapearTarifasIA(textoImport);
      if (resultado.tarifas?.length > 0) {
        setPropuesta(resultado.tarifas.map(t => ({
          tipo_original:      t.tipo_original,
          tipo_mapeado:       t.tipo_mapeado,
          valor_sin_imp:      t.valor_sin_imp,
          valor_con_imp:      Math.round(t.valor_sin_imp * (1 + IVA)),
          valor_dist_sin_imp: Math.round(t.valor_sin_imp * (1 + DIST)),
          valor_dist_con_imp: Math.round(t.valor_sin_imp * (1 + DIST) * (1 + IVA)),
          confianza:          t.confianza,
        })));
      } else {
        alert('La IA no detectó tarifas. Verifica el formato del texto.');
      }
    } catch (e) {
      console.error(e);
      alert('Error al analizar: ' + e.message);
    }
    setImportando(false);
  };

  const aceptarPropuesta = async items => {
    const rows = items.map(p => ({
      cliente_id:         clienteId,
      cartera_id:         carteraId,
      tipo_gestion:       p.tipo_mapeado,
      valor_sin_imp:      p.valor_sin_imp,
      valor_con_imp:      p.valor_con_imp,
      valor_dist_sin_imp: p.valor_dist_sin_imp,
      valor_dist_con_imp: p.valor_dist_con_imp,
    }));
    await supabase.from('tarifas').insert(rows);
    setPropuesta(null);
    setShowImport(false);
    setTextoImport('');
    cargar();
  };

  const FilaEditable = ({ t }) => {
    const [local, setLocal] = useState(t);
    const setV = k => e => {
      const num = parseInt(e.target.value.replace(/\./g, '')) || 0;
      setLocal(p => ({ ...p, [k]: num }));
    };
    const autoFill = () => setLocal(p => ({ ...p, ...calcular(p.valor_sin_imp) }));

    return (
      <tr style={{ background: 'var(--gold-bg)' }}>
        <td style={{ padding: '6px 10px' }}>
          <input value={local.tipo_gestion} onChange={e => setLocal(p => ({ ...p, tipo_gestion: e.target.value }))} style={{ fontSize: 11 }} />
        </td>
        {['valor_sin_imp','valor_con_imp','valor_dist_sin_imp','valor_dist_con_imp'].map(k => (
          <td key={k} style={{ padding: '6px 8px' }}>
            <input value={local[k] || ''} onChange={setV(k)} style={{ fontSize: 11, textAlign: 'right', width: 90 }} placeholder="0" />
          </td>
        ))}
        <td style={{ padding: '6px 8px' }}>
          <div className="row" style={{ gap: 4 }}>
            <button className="btn btn-amber btn-sm" onClick={autoFill} title="Calcular automáticamente">⚡</button>
            <button className="btn btn-green btn-sm" onClick={() => guardarFila(local)}>✓</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditando(null)}>✕</button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <div className="row" style={{ marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>{carteraNombre}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--blue-bg)', border: '1px solid rgba(96,165,250,.3)', color: 'var(--blue)' }}
            onClick={() => { setShowImport(!showImport); setPropuesta(null); setTextoImport(''); }}
          >🤖 Importar con IA</button>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-lo)', color: 'var(--gold)' }}
            onClick={() => setEditando({ tipo_gestion: '', valor_sin_imp: 0, valor_con_imp: 0, valor_dist_sin_imp: 0, valor_dist_con_imp: 0, _nueva: true })}
          >+ Agregar</button>
        </div>
      </div>

      {/* Importador IA */}
      {showImport && (
        <div style={{ background: 'var(--s2)', borderRadius: 10, border: '1px solid rgba(96,165,250,.3)', padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', marginBottom: 6 }}>🤖 Importar tarifas con IA</div>
          <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 12 }}>
            Pega el listado de tarifas del cliente — la IA mapea automáticamente al formato del sistema.
            También puedes arrastrar un archivo <strong>.txt</strong>.
          </div>

          {!propuesta && !importando && (
            <div>
              <textarea
                value={textoImport}
                onChange={e => setTextoImport(e.target.value)}
                placeholder={`Pega aquí el listado de tarifas del cliente...

Ejemplo:
Notificación Personal: $85.000
Embargo: $55.000
Búsqueda Negativa: $22.000
Retiro de bienes: $120.000`}
                style={{
                  width: '100%', minHeight: 160,
                  background: 'var(--s1)', border: '1px solid var(--bdr)',
                  borderRadius: 8, padding: '10px 12px',
                  color: 'var(--txt)', fontSize: 12,
                  lineHeight: 1.8, outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box',
                  fontFamily: "'DM Mono', monospace"
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
                  style={{ padding: '8px 18px' }}
                  onClick={analizarTextoImport}
                  disabled={!textoImport.trim()}
                >🤖 Analizar con IA</button>
                <button className="btn btn-ghost" onClick={() => { setShowImport(false); setTextoImport(''); }}>Cancelar</button>
                <span style={{ fontSize: 10, color: 'var(--txt-lo)' }}>También puedes arrastrar un .txt</span>
              </div>
            </div>
          )}

          {importando && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <span className="spin" style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>🤖</span>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>Analizando con IA...</div>
            </div>
          )}

          {propuesta && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', marginBottom: 10 }}>
                ✓ IA detectó {propuesta.length} tarifas — revisa y confirma
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: 'var(--s0)' }}>
                      <th>Nombre en documento</th>
                      <th>→ Tipo mapeado</th>
                      <th style={{ textAlign: 'right' }}>S/Imp</th>
                      <th style={{ textAlign: 'right' }}>C/Imp</th>
                      <th style={{ textAlign: 'right' }}>+Dist S/Imp</th>
                      <th style={{ textAlign: 'right' }}>+Dist C/Imp</th>
                      <th>Confianza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propuesta.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--bdr)' }}>
                        <td style={{ padding: '7px 10px', color: 'var(--txt-mid)', fontStyle: 'italic' }}>{p.tipo_original}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <select
                            value={p.tipo_mapeado}
                            onChange={e => setPropuesta(prev => prev.map((x, j) => j === i ? { ...x, tipo_mapeado: e.target.value } : x))}
                            style={{ fontSize: 11 }}
                          >
                            {['Notificación Personal','Notificación por Cédula','Notificación en Oficina','Búsqueda',
                              'Requerimiento de Pago (no paga)','Requerimiento de Pago (si paga)',
                              'Embargo Bienes Muebles','Embargo Bienes Inmuebles','Retiro de Bienes Muebles',
                              'Embargo Incautación y Retiro','Medida Precautoria','Lanzamiento Precario',
                              'Lanzamiento otros juicios','Diligencia frustrada'
                            ].map(t => <option key={t}>{t}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--green)',  fontWeight: 700 }}>${fmt(p.valor_sin_imp)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--blue)',   fontWeight: 700 }}>${fmt(p.valor_con_imp)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--amber)',  fontWeight: 700 }}>${fmt(p.valor_dist_sin_imp)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--violet)', fontWeight: 700 }}>${fmt(p.valor_dist_con_imp)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                            color:      p.confianza >= 90 ? 'var(--green)' : p.confianza >= 75 ? 'var(--amber)' : 'var(--red)',
                            background: (p.confianza >= 90 ? 'var(--green)' : p.confianza >= 75 ? 'var(--amber)' : 'var(--red)') + '18',
                          }}>{p.confianza}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <button className="btn btn-gold" style={{ padding: '9px 20px', fontSize: 13 }} onClick={() => aceptarPropuesta(propuesta)}>✓ Aceptar e importar</button>
                <button className="btn btn-ghost" onClick={() => { setPropuesta(null); setTextoImport(''); }}>↺ Volver</button>
                <button className="btn btn-ghost" onClick={() => { setPropuesta(null); setShowImport(false); setTextoImport(''); }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--txt-mid)' }}>
          <span className="spin">⚙</span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr style={{ background: 'var(--s0)' }}>
                <th style={{ minWidth: 180 }}>Tipo de gestión</th>
                <th style={{ textAlign: 'right', color: 'var(--green)' }}>S/Imp</th>
                <th style={{ textAlign: 'right', color: 'var(--blue)' }}>C/Imp</th>
                <th style={{ textAlign: 'right', color: 'var(--amber)' }}>+Dist S/Imp</th>
                <th style={{ textAlign: 'right', color: 'var(--violet)' }}>+Dist C/Imp</th>
                <th style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {editando?._nueva && <FilaEditable t={editando} />}
              {tarifas.map((t, i) => (
                editando?.id === t.id ? (
                  <FilaEditable key={t.id} t={editando} />
                ) : (
                  <tr key={t.id} style={{ background: i % 2 ? 'var(--s2,rgba(28,38,56,.3))' : 'transparent', borderBottom: '1px solid var(--bdr)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--txt)', fontWeight: 600 }}>{t.tipo_gestion}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--green)',  fontWeight: 700 }}>${fmt(t.valor_sin_imp)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--blue)',   fontWeight: 700 }}>${fmt(t.valor_con_imp)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--amber)',  fontWeight: 700 }}>${fmt(t.valor_dist_sin_imp)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--violet)', fontWeight: 700 }}>${fmt(t.valor_dist_con_imp)}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <div className="row" style={{ gap: 4 }}>
                        <button className="btn btn-blue btn-sm" onClick={() => setEditando({ ...t })}>✏</button>
                        <button className="btn btn-red btn-sm" onClick={() => eliminarFila(t.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              ))}
              {tarifas.length === 0 && !editando?._nueva && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--txt-mid)', fontStyle: 'italic' }}>
                    Sin tarifas — agrega una o importa con IA
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ArancelesReceptor() {
  const [aranceles, setAranceles] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editando, setEditando]   = useState(null);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase.from('aranceles').select('*').order('tipo_gestion');
    setAranceles(data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async a => {
    await supabase.from('aranceles').update({
      valor_sin_imp:      a.valor_sin_imp,
      valor_con_imp:      a.valor_con_imp,
      valor_dist_sin_imp: a.valor_dist_sin_imp,
      valor_dist_con_imp: a.valor_dist_con_imp,
    }).eq('id', a.id);
    setEditando(null);
    cargar();
  };

  const FilaArancel = ({ a }) => {
    const [local, setLocal] = useState(a);
    const setV = k => e => {
      const num = parseInt(e.target.value.replace(/\./g, '')) || 0;
      setLocal(p => ({ ...p, [k]: num }));
    };
    const autoFill = () => setLocal(p => ({ ...p, ...calcular(p.valor_sin_imp) }));

    return (
      <tr style={{ background: 'var(--gold-bg)', borderBottom: '1px solid var(--bdr)' }}>
        <td style={{ padding: '6px 10px', color: 'var(--txt)', fontWeight: 600 }}>{a.tipo_gestion}</td>
        {['valor_sin_imp','valor_con_imp','valor_dist_sin_imp','valor_dist_con_imp'].map(k => (
          <td key={k} style={{ padding: '6px 8px' }}>
            <input value={local[k] || ''} onChange={setV(k)} style={{ fontSize: 11, textAlign: 'right', width: 90 }} />
          </td>
        ))}
        <td style={{ padding: '6px 8px' }}>
          <div className="row" style={{ gap: 4 }}>
            <button className="btn btn-amber btn-sm" onClick={autoFill} title="Calcular automáticamente">⚡</button>
            <button className="btn btn-green btn-sm" onClick={() => guardar(local)}>✓</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditando(null)}>✕</button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 12 }}>
        Valores Diario Oficial 2026 · Quintero · Edita para actualizar
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr style={{ background: 'var(--s0)' }}>
              <th style={{ minWidth: 220 }}>Tipo de gestión</th>
              <th style={{ textAlign: 'right', color: 'var(--green)' }}>S/Imp</th>
              <th style={{ textAlign: 'right', color: 'var(--blue)' }}>C/Imp</th>
              <th style={{ textAlign: 'right', color: 'var(--amber)' }}>+Dist S/Imp</th>
              <th style={{ textAlign: 'right', color: 'var(--violet)' }}>+Dist C/Imp</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}><span className="spin">⚙</span></td></tr>
            ) : aranceles.map((a, i) => (
              editando?.id === a.id ? (
                <FilaArancel key={a.id} a={editando} />
              ) : (
                <tr key={a.id} style={{ background: i % 2 ? 'var(--s2,rgba(28,38,56,.3))' : 'transparent', borderBottom: '1px solid var(--bdr)' }}>
                  <td style={{ padding: '8px 10px', color: 'var(--txt)', fontWeight: 600 }}>
                    {a.tipo_gestion}
                    {a.descripcion && <div style={{ fontSize: 9, color: 'var(--txt-lo)', marginTop: 1 }}>{a.descripcion}</div>}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--green)',  fontWeight: 700 }}>${fmt(a.valor_sin_imp)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--blue)',   fontWeight: 700 }}>${fmt(a.valor_con_imp)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--amber)',  fontWeight: 700 }}>${fmt(a.valor_dist_sin_imp)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--violet)', fontWeight: 700 }}>${fmt(a.valor_dist_con_imp)}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <button className="btn btn-blue btn-sm" onClick={() => setEditando({ ...a })}>✏</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Clientes() {
  const [clientes, setClientes]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [sel, setSel]                     = useState(null);
  const [carteraActiva, setCarteraActiva] = useState(null);
  const [carteras, setCarteras]           = useState([]);
  const [tab, setTab]                     = useState('clientes');
  const [showNuevo, setShowNuevo]         = useState(false);
  const [nuevoCliente, setNuevoCliente]   = useState({ nombre: '', tipo: 'Estudio Jurídico', impuesto: 'cliente', boleta: 'cartera', cierre_min: '' });
  const [nuevaCartera, setNuevaCartera]   = useState('');

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase.from('clientes').select('*').order('nombre');
    setClientes(data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const seleccionarCliente = async cl => {
    setSel(cl);
    const { data } = await supabase.from('carteras').select('*').eq('cliente_id', cl.id).order('nombre');
    setCarteras(data || []);
    setCarteraActiva(data?.[0] || null);
  };

  const guardarCliente = async () => {
    if (!nuevoCliente.nombre) return;
    await supabase.from('clientes').insert([{
      nombre:         nuevoCliente.nombre,
      tipo:           nuevoCliente.tipo,
      impuesto:       nuevoCliente.impuesto,
      boleta:         nuevoCliente.boleta,
      cierre_min:     nuevoCliente.cierre_min || null,
      causas_activas: 0,
    }]);
    setShowNuevo(false);
    setNuevoCliente({ nombre: '', tipo: 'Estudio Jurídico', impuesto: 'cliente', boleta: 'cartera', cierre_min: '' });
    cargar();
  };

  const agregarCartera = async () => {
    if (!nuevaCartera.trim() || !sel) return;
    await supabase.from('carteras').insert([{ cliente_id: sel.id, nombre: nuevaCartera.trim() }]);
    setNuevaCartera('');
    const { data } = await supabase.from('carteras').select('*').eq('cliente_id', sel.id).order('nombre');
    setCarteras(data || []);
    if (!carteraActiva) setCarteraActiva(data?.[0] || null);
  };

  const tipoColor = t => {
    if (t === 'Abogado Independiente') return { c: 'var(--green)',  bg: 'var(--green-bg)'  };
    if (t === 'Cartera')               return { c: 'var(--blue)',   bg: 'var(--blue-bg)'   };
    return                                    { c: 'var(--violet)', bg: 'var(--violet-bg)' };
  };

  return (
    <div>
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>
            Clientes & Tarifas
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginTop: 2 }}>
            Cliente → Cartera → Tarifas por gestión
          </div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          {[{ k: 'clientes', l: '🏢 Clientes' }, { k: 'aranceles', l: '📋 Aranceles propios' }].map(t => (
            <button
              key={t.k}
              className="btn btn-ghost btn-sm"
              style={tab === t.k ? { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gold-bg)' } : {}}
              onClick={() => { setTab(t.k); setSel(null); }}
            >{t.l}</button>
          ))}
        </div>
        {tab === 'clientes' && (
          <button className="btn btn-gold" onClick={() => setShowNuevo(!showNuevo)}>
            {showNuevo ? '✕ Cancelar' : '+ Nuevo Cliente'}
          </button>
        )}
      </div>

      {tab === 'aranceles' && (
        <div className="card card-p">
          <div className="sl">Aranceles Diario Oficial 2026 — Quintero</div>
          <ArancelesReceptor />
        </div>
      )}

      {tab === 'clientes' && (
        <>
          {showNuevo && (
            <div className="card card-p" style={{ marginBottom: 14 }}>
              <div className="sl">Nuevo Cliente</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div className="sl" style={{ marginBottom: 4 }}>Nombre *</div>
                  <input value={nuevoCliente.nombre} onChange={e => setNuevoCliente(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del cliente" />
                </div>
                <div>
                  <div className="sl" style={{ marginBottom: 4 }}>Tipo</div>
                  <select value={nuevoCliente.tipo} onChange={e => setNuevoCliente(p => ({ ...p, tipo: e.target.value }))}>
                    <option>Estudio Jurídico</option>
                    <option>Cartera</option>
                    <option>Abogado Independiente</option>
                  </select>
                </div>
                <div>
                  <div className="sl" style={{ marginBottom: 4 }}>Día de cierre</div>
                  <input type="number" min="1" max="31" value={nuevoCliente.cierre_min} onChange={e => setNuevoCliente(p => ({ ...p, cierre_min: e.target.value }))} placeholder="Día del mes" />
                </div>
                <div>
                  <div className="sl" style={{ marginBottom: 4 }}>¿Quién paga el impuesto?</div>
                  <select value={nuevoCliente.impuesto} onChange={e => setNuevoCliente(p => ({ ...p, impuesto: e.target.value }))}>
                    <option value="cliente">Cliente</option>
                    <option value="receptor">Receptor</option>
                  </select>
                </div>
                <div>
                  <div className="sl" style={{ marginBottom: 4 }}>Tipo de boleta</div>
                  <select value={nuevoCliente.boleta} onChange={e => setNuevoCliente(p => ({ ...p, boleta: e.target.value }))}>
                    <option value="cartera">1 boleta por cartera</option>
                    <option value="individual">Boleta individual por causa</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <button className="btn btn-gold" onClick={guardarCliente}>Guardar cliente</button>
                <button className="btn btn-ghost" onClick={() => setShowNuevo(false)}>Cancelar</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: sel ? '260px 1fr' : 'repeat(3, 1fr)', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--txt-mid)' }}>
                  <span className="spin" style={{ fontSize: 24 }}>⚙</span>
                </div>
              ) : clientes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--txt-mid)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
                  <div>No hay clientes aún</div>
                </div>
              ) : clientes.map(cl => {
                const { c, bg } = tipoColor(cl.tipo);
                return (
                  <div
                    key={cl.id}
                    className="card card-p"
                    style={{ cursor: 'pointer', borderColor: sel?.id === cl.id ? 'var(--gold)' : 'var(--bdr)' }}
                    onClick={() => sel?.id === cl.id ? setSel(null) : seleccionarCliente(cl)}
                  >
                    <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--gold-bg)', border: '1px solid var(--gold-ring)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
                        {cl.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="row" style={{ gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--txt)' }}>{cl.nombre}</span>
                          <span className="tag" style={{ color: c, background: bg, border: `1px solid ${c}33` }}>{cl.tipo}</span>
                        </div>
                        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                          {cl.cierre_min && <span style={{ fontSize: 9, color: 'var(--txt-lo)' }}>Cierre día <strong style={{ color: 'var(--amber)' }}>{cl.cierre_min}</strong></span>}
                          <span className="tag" style={{ color: cl.impuesto === 'cliente' ? 'var(--green)' : 'var(--amber)', background: cl.impuesto === 'cliente' ? 'var(--green-bg)' : 'var(--amber-bg)', border: `1px solid ${cl.impuesto === 'cliente' ? 'rgba(52,211,153,.3)' : 'rgba(251,191,36,.3)'}` }}>Imp: {cl.impuesto}</span>
                          <span className="tag" style={{ color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid rgba(96,165,250,.3)' }}>{cl.boleta === 'cartera' ? '1 boleta/cartera' : 'Boleta individual'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {sel && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="card card-p">
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>{sel.nombre}</div>
                      <span className="tag" style={{ color: tipoColor(sel.tipo).c, background: tipoColor(sel.tipo).bg, border: `1px solid ${tipoColor(sel.tipo).c}33` }}>{sel.tipo}</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSel(null)}>✕</button>
                  </div>

                  {sel.tipo === 'Abogado Independiente' && (
                    <div className="alert alert-amber" style={{ marginBottom: 10 }}>
                      <span>💡</span>
                      <span style={{ fontSize: 11, color: 'var(--amber)' }}>Cliente independiente — se aplica el arancel oficial del receptor por defecto</span>
                    </div>
                  )}

                  <div className="sl">Carteras</div>
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {carteras.map(ca => (
                      <button
                        key={ca.id}
                        className="btn btn-sm"
                        style={carteraActiva?.id === ca.id
                          ? { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gold-bg)' }
                          : { background: 'none', border: '1px solid var(--bdr)', color: 'var(--txt-mid)' }}
                        onClick={() => setCarteraActiva(ca)}
                      >{ca.nombre}</button>
                    ))}
                    <div className="row" style={{ gap: 5 }}>
                      <input placeholder="Nueva cartera..." value={nuevaCartera} onChange={e => setNuevaCartera(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregarCartera()} style={{ width: 140, fontSize: 11 }} />
                      <button className="btn btn-gold btn-sm" onClick={agregarCartera}>+ Agregar</button>
                    </div>
                  </div>
                </div>

                {carteraActiva && (
                  <div className="card card-p">
                    <TablaTarifas clienteId={sel.id} carteraId={carteraActiva.id} carteraNombre={carteraActiva.nombre} />
                  </div>
                )}

                {!carteraActiva && carteras.length === 0 && (
                  <div className="card card-p" style={{ textAlign: 'center', color: 'var(--txt-mid)' }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                    <div>Agrega una cartera para definir tarifas</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}