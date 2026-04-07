import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';
import { TRIBUNALES_POR_CORTE } from '../data/tribunales';

export default function Configuracion() {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading]   = useState(true);
  const [guardado, setGuardado] = useState(false);

  const [cfg, setCfg] = useState({
    nombre:        '',
    email:         '',
    telefono:      '',
    sitioWeb:      '',
    corte:         'C.A. de Valparaíso',
    tribunal:      '',
    comunaAsiento: '',
    tasaRetencion: '15,25',
  });

  const [plantilla, setPlantilla] = useState({
    nombre: true, cargo: true, tribunal: true,
    rol: true, caratulado: true,
    email: true, telefono: true,
  });

  const [tiposGestion, setTiposGestion]       = useState([]);
  const [resultados, setResultados]           = useState([]);
  const [competencias, setCompetencias]       = useState([]);
  const [nuevoTipo, setNuevoTipo]             = useState('');
  const [nuevoResultado, setNuevoResultado]   = useState({ nombre: '', subtipo: '' });
  const [nuevaCompetencia, setNuevaCompetencia] = useState('');

  const setC    = k => e => setCfg(p => ({ ...p, [k]: e.target.value }));
  const toggleP = k => setPlantilla(p => ({ ...p, [k]: !p[k] }));

  // ── Cargar todo ────────────────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      // Configuración
      const { data } = await supabase
        .from('configuracion').select('*').single();
      if (data) {
        setCfg({
          nombre:        data.nombre         || '',
          email:         data.email          || '',
          telefono:      data.telefono       || '',
          sitioWeb:      data.sitio_web      || '',
          corte:         data.corte          || 'C.A. de Valparaíso',
          tribunal:      data.tribunal       || '',
          comunaAsiento: data.comuna_asiento || '',
          tasaRetencion: data.tasa_retencion?.toString().replace('.', ',') || '15,25',
        });
      }

      // Tipos de gestión
      const { data: tipos } = await supabase
        .from('tipos_gestion').select('*').eq('activo', true).order('nombre');
      if (tipos) setTiposGestion(tipos);

      // Resultados
      const { data: ress } = await supabase
        .from('resultados_gestion').select('*').eq('activo', true).order('nombre');
      if (ress) setResultados(ress);

      // Competencias
      const { data: comps } = await supabase
        .from('competencias').select('*').eq('activo', true).order('nombre');
      if (comps) setCompetencias(comps);

      setLoading(false);
    };
    cargar();
  }, []);

  // ── Guardar configuración ──────────────────────────────────────────────────
  const guardar = async () => {
    try {
      const { error } = await supabase
        .from('configuracion')
        .update({
          nombre:         cfg.nombre,
          email:          cfg.email,
          telefono:       cfg.telefono,
          sitio_web:      cfg.sitioWeb,
          corte:          cfg.corte,
          tribunal:       cfg.tribunal,
          comuna_asiento: cfg.comunaAsiento,
          tasa_retencion: parseFloat(cfg.tasaRetencion.replace(',', '.')),
        })
        .eq('id', 1);
      if (error) throw error;
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Error al guardar');
    }
  };

  // ── CRUD Tipos de gestión ──────────────────────────────────────────────────
  const agregarTipo = async () => {
    if (!nuevoTipo.trim()) return;
    await supabase.from('tipos_gestion').insert([{
      nombre: nuevoTipo.trim(), activo: true
    }]);
    setNuevoTipo('');
    const { data } = await supabase
      .from('tipos_gestion').select('*').eq('activo', true).order('nombre');
    setTiposGestion(data || []);
  };

  const eliminarTipo = async (id) => {
    await supabase.from('tipos_gestion').update({ activo: false }).eq('id', id);
    setTiposGestion(prev => prev.filter(t => t.id !== id));
  };

  // ── CRUD Resultados ────────────────────────────────────────────────────────
  const agregarResultado = async () => {
    if (!nuevoResultado.nombre.trim()) return;
    await supabase.from('resultados_gestion').insert([{
      nombre:  nuevoResultado.nombre.trim(),
      subtipo: nuevoResultado.subtipo?.trim() || null,
      activo:  true
    }]);
    setNuevoResultado({ nombre: '', subtipo: '' });
    const { data } = await supabase
      .from('resultados_gestion').select('*').eq('activo', true).order('nombre');
    setResultados(data || []);
  };

  const eliminarResultado = async (id) => {
    await supabase.from('resultados_gestion').update({ activo: false }).eq('id', id);
    setResultados(prev => prev.filter(r => r.id !== id));
  };

  // ── CRUD Competencias ──────────────────────────────────────────────────────
  const agregarCompetencia = async () => {
    if (!nuevaCompetencia.trim()) return;
    await supabase.from('competencias').insert([{
      nombre: nuevaCompetencia.trim(), activo: true
    }]);
    setNuevaCompetencia('');
    const { data } = await supabase
      .from('competencias').select('*').eq('activo', true).order('nombre');
    setCompetencias(data || []);
  };

  const eliminarCompetencia = async (id) => {
    await supabase.from('competencias').update({ activo: false }).eq('id', id);
    setCompetencias(prev => prev.filter(c => c.id !== id));
  };

  const ENC = [
    { k: 'nombre',     l: 'Nombre del receptor' },
    { k: 'cargo',      l: 'Cargo' },
    { k: 'tribunal',   l: 'Tribunal (desde la causa)' },
    { k: 'rol',        l: 'ROL de la causa' },
    { k: 'caratulado', l: 'Caratulado' },
  ];
  const PIE = [
    { k: 'email',    l: 'Email' },
    { k: 'telefono', l: 'Teléfono' },
  ];

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 48, color: 'var(--txt-mid)' }}>
      <span className="spin" style={{ fontSize: 32 }}>⚙</span>
      <div style={{ marginTop: 8 }}>Cargando configuración...</div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>
          Datos & Configuración
        </div>
        <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginTop: 2 }}>
          Datos personales, judiciales y preferencias del sistema
        </div>
      </div>

      <div className="g2" style={{ gap: 14 }}>

        {/* ── Columna izquierda ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Datos personales */}
          <div className="card card-p">
            <div className="sl">Datos personales</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Nombre completo', key: 'nombre' },
                { label: 'Email',           key: 'email' },
                { label: 'Teléfono',        key: 'telefono' },
                { label: 'Sitio web',       key: 'sitioWeb' },
              ].map(f => (
                <div key={f.key}>
                  <div className="sl" style={{ marginBottom: 4 }}>{f.label}</div>
                  <input value={cfg[f.key]} onChange={setC(f.key)} />
                </div>
              ))}
            </div>
          </div>

          {/* Datos judiciales */}
          <div className="card card-p">
            <div className="sl">Datos judiciales</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div className="sl" style={{ marginBottom: 4 }}>Corte de Apelaciones</div>
                <select
                  value={cfg.corte}
                  onChange={e => {
                    const corte = e.target.value;
                    const tribunales = TRIBUNALES_POR_CORTE[corte] || [];
                    setCfg(p => ({ ...p, corte, tribunal: tribunales[0] || '' }));
                  }}
                >
                  {Object.keys(TRIBUNALES_POR_CORTE).map(c => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="sl" style={{ marginBottom: 4 }}>Tribunal predeterminado</div>
                <select value={cfg.tribunal} onChange={setC('tribunal')}>
                  {(TRIBUNALES_POR_CORTE[cfg.corte] || []).map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="sl" style={{ marginBottom: 4 }}>Comuna de asiento del tribunal</div>
                <input
                  value={cfg.comunaAsiento}
                  onChange={setC('comunaAsiento')}
                  placeholder="Quintero"
                />
              </div>
            </div>
          </div>

          {/* Tributario */}
          <div className="card card-p">
            <div className="sl">Parámetros tributarios</div>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>
                  Tasa de retención de honorarios
                </div>
                <div style={{ fontSize: 9, color: 'var(--txt-mid)', marginTop: 2 }}>
                  Actualiza cuando el SII lo modifique
                </div>
              </div>
              <div className="row" style={{ gap: 7 }}>
                <input
                  value={cfg.tasaRetencion}
                  onChange={setC('tasaRetencion')}
                  style={{
                    width: 64, color: 'var(--gold)',
                    fontSize: 16, fontWeight: 700,
                    fontFamily: "'Cormorant Garamond', serif",
                    textAlign: 'center'
                  }}
                />
                <span style={{ color: 'var(--txt-mid)' }}>%</span>
              </div>
            </div>
            <div style={{ background: 'var(--s2)', borderRadius: 8, padding: 10, border: '1px solid var(--bdr)' }}>
              <div className="sl" style={{ marginBottom: 7 }}>Historial</div>
              {[
                { tasa: '10,75%', año: '2020', vigente: false },
                { tasa: '11,50%', año: '2021', vigente: false },
                { tasa: '12,25%', año: '2022', vigente: false },
                { tasa: '13,00%', año: '2023', vigente: false },
                { tasa: '13,75%', año: '2024', vigente: false },
                { tasa: '14,50%', año: '2025', vigente: false },
                { tasa: '15,25%', año: '2026', vigente: true  },
                { tasa: '16,00%', año: '2027', vigente: false },
                { tasa: '17,00%', año: '2028', vigente: false },
              ].map((h, i) => (
                <div key={i} className="row" style={{
                  justifyContent: 'space-between',
                  padding: '5px 0',
                  borderBottom: '1px solid var(--bdr)',
                  fontSize: 11
                }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
                    {h.tasa}
                  </span>
                  <span style={{ color: 'var(--txt-mid)' }}>{h.año}</span>
                  {h.vigente && (
                    <span className="tag" style={{
                      color: 'var(--green)', background: 'var(--green-bg)',
                      border: '1px solid rgba(52,211,153,.3)'
                    }}>Vigente</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Apariencia */}
          <div className="card card-p">
            <div className="sl">Apariencia</div>
            <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 12 }}>
              Preferencia personal — cada usuario elige la suya
            </div>
            <div className="g2" style={{ gap: 10 }}>
              {[
                { k: 'dark',  l: '🌙 Oscuro', bg: '#0B0F17', txt: '#E2EAF8' },
                { k: 'light', l: '☀️ Claro',  bg: '#F4F6FA', txt: '#1A2340' },
              ].map(t => (
                <button
                  key={t.k}
                  onClick={t.k !== theme ? toggleTheme : undefined}
                  style={{
                    padding: 14, borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${theme === t.k ? 'var(--gold)' : 'var(--bdr)'}`,
                    background: t.bg,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 6
                  }}
                >
                  <div style={{
                    width: 36, height: 22, borderRadius: 5,
                    background: t.bg, border: '1px solid rgba(128,128,128,.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: 9, color: t.txt, fontWeight: 700 }}>Aa</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: theme === t.k ? 700 : 400,
                    color: theme === t.k ? 'var(--gold)' : t.txt
                  }}>{t.l}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tipos de gestión */}
          <div className="card card-p">
            <div className="sl">Tipos de gestión</div>
            <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 12 }}>
              Lo que el cliente solicita — se asigna al crear la causa
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                placeholder="Ej: Notificación Personal, Embargo..."
                value={nuevoTipo}
                onChange={e => setNuevoTipo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agregarTipo()}
              />
              <button className="btn btn-gold btn-sm" onClick={agregarTipo}>+ Agregar</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tiposGestion.map(t => (
                <div key={t.id} className="row" style={{
                  justifyContent: 'space-between', padding: '7px 10px',
                  background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bdr)'
                }}>
                  <span style={{ fontSize: 12, color: 'var(--txt)' }}>{t.nombre}</span>
                  <button
                    className="btn btn-red btn-sm"
                    onClick={() => eliminarTipo(t.id)}
                    style={{ padding: '2px 8px' }}
                  >✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Competencias */}
          <div className="card card-p">
            <div className="sl">Competencias</div>
            <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 12 }}>
              Materia del tribunal — se asigna al crear la causa
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                placeholder="Ej: Civil, Laboral, Familia..."
                value={nuevaCompetencia}
                onChange={e => setNuevaCompetencia(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agregarCompetencia()}
              />
              <button className="btn btn-gold btn-sm" onClick={agregarCompetencia}>+ Agregar</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {competencias.map(c => (
                <div key={c.id} className="row" style={{
                  justifyContent: 'space-between', padding: '7px 10px',
                  background: 'var(--s2)', borderRadius: 8, border: '1px solid var(--bdr)'
                }}>
                  <span style={{ fontSize: 12, color: 'var(--txt)' }}>{c.nombre}</span>
                  <button
                    className="btn btn-red btn-sm"
                    onClick={() => eliminarCompetencia(c.id)}
                    style={{ padding: '2px 8px' }}
                  >✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Resultados de gestión */}
          <div className="card card-p">
            <div className="sl">Resultados de gestión</div>
            <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 12 }}>
              Lo que ocurrió al ejecutar la diligencia — define el precio del estampe
            </div>

            {/* Agregar nuevo resultado */}
            <div style={{
              background: 'var(--s2)', borderRadius: 9,
              border: '1px solid var(--bdr)', padding: 12, marginBottom: 12
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
                <div>
                  <div className="sl" style={{ marginBottom: 4 }}>Resultado *</div>
                  <input
                    placeholder="Positiva, Negativa, Frustrado..."
                    value={nuevoResultado.nombre}
                    onChange={e => setNuevoResultado(p => ({ ...p, nombre: e.target.value }))}
                    list="lista-resultados"
                  />
                  <datalist id="lista-resultados">
                    {['Positiva','Positivo','Negativa','Negativo',
                      'Frustrado','Frustrada','Si paga','No paga',
                      'Oposición','Alzamiento','Certificación'
                    ].map(r => <option key={r} value={r} />)}
                  </datalist>
                </div>
                <div>
                  <div className="sl" style={{ marginBottom: 4 }}>Subtipo (opcional)</div>
                  <input
                    placeholder="Ej: No vive ahí, Art. 44..."
                    value={nuevoResultado.subtipo}
                    onChange={e => setNuevoResultado(p => ({ ...p, subtipo: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && agregarResultado()}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button className="btn btn-gold btn-sm" onClick={agregarResultado}>+ Agregar</button>
                </div>
              </div>
            </div>

            {/* Listado agrupado por resultado */}
            {[...new Set(resultados.map(r => r.nombre))].map(nombreRes => {
              const items = resultados.filter(r => r.nombre === nombreRes);
              const resColor =
                nombreRes.includes('Positiv') || nombreRes === 'Si paga' ? 'var(--green)' :
                nombreRes.includes('Negativ') || nombreRes === 'No paga' ? 'var(--red)'   :
                nombreRes.includes('Frustrad')                           ? 'var(--amber)' :
                'var(--blue)';
              return (
                <div key={nombreRes} style={{
                  background: 'var(--s2)', borderRadius: 9,
                  border: '1px solid var(--bdr)',
                  marginBottom: 8, overflow: 'hidden'
                }}>
                  {/* Header resultado */}
                  <div style={{
                    padding: '8px 12px', borderBottom: '1px solid var(--bdr)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 9px',
                      borderRadius: 5, color: resColor, background: resColor + '18',
                    }}>
                      {nombreRes}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--txt-lo)' }}>
                      {items.length} subtipo(s)
                    </span>
                  </div>

                  {/* Subtipos */}
                  <div style={{ padding: '8px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {items.map(r => (
                      <div key={r.id} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '3px 9px', background: 'var(--s1)',
                        borderRadius: 6, border: '1px solid var(--bdr)'
                      }}>
                        <span style={{ fontSize: 11, color: 'var(--txt)' }}>
                          {r.subtipo || '—'}
                        </span>
                        <button
                          onClick={() => eliminarResultado(r.id)}
                          style={{
                            background: 'none', border: 'none',
                            color: 'var(--red)', cursor: 'pointer',
                            fontSize: 10, padding: '0 2px', lineHeight: 1
                          }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* ── Columna derecha ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Configuración estampe */}
          <div className="card card-p">
            <div className="sl">Configuración del estampe</div>
            <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 12 }}>
              Encabezado y pie · Firma y precio siempre incluidos
            </div>
            <div style={{ fontSize: 10, color: 'var(--txt-mid)', marginBottom: 8, fontWeight: 600 }}>
              ENCABEZADO
            </div>
            {ENC.map(o => (
              <label key={o.k} style={{
                display: 'flex', gap: 9, alignItems: 'center',
                padding: '7px 0', borderBottom: '1px solid var(--bdr)', cursor: 'pointer'
              }}>
                <div
                  onClick={() => toggleP(o.k)}
                  style={{
                    width: 17, height: 17, borderRadius: 4,
                    border: `2px solid ${plantilla[o.k] ? 'var(--gold)' : 'var(--bdr)'}`,
                    background: plantilla[o.k] ? 'var(--gold)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, cursor: 'pointer', transition: 'all .15s'
                  }}
                >
                  {plantilla[o.k] && <span style={{ color: '#0B0F17', fontSize: 10, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: 12, color: plantilla[o.k] ? 'var(--txt)' : 'var(--txt-mid)' }}>
                  {o.l}
                </span>
              </label>
            ))}
            <div style={{ fontSize: 10, color: 'var(--txt-mid)', margin: '12px 0 8px', fontWeight: 600 }}>
              PIE DE PÁGINA
            </div>
            {PIE.map(o => (
              <label key={o.k} style={{
                display: 'flex', gap: 9, alignItems: 'center',
                padding: '7px 0', borderBottom: '1px solid var(--bdr)', cursor: 'pointer'
              }}>
                <div
                  onClick={() => toggleP(o.k)}
                  style={{
                    width: 17, height: 17, borderRadius: 4,
                    border: `2px solid ${plantilla[o.k] ? 'var(--gold)' : 'var(--bdr)'}`,
                    background: plantilla[o.k] ? 'var(--gold)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, cursor: 'pointer', transition: 'all .15s'
                  }}
                >
                  {plantilla[o.k] && <span style={{ color: '#0B0F17', fontSize: 10, fontWeight: 900 }}>✓</span>}
                </div>
                <span style={{ fontSize: 12, color: plantilla[o.k] ? 'var(--txt)' : 'var(--txt-mid)' }}>
                  {o.l}
                </span>
              </label>
            ))}
            {[
              { l: 'Firma digital',               e: 'Siempre incluida · No configurable' },
              { l: 'Precio (arancel + distancia)', e: 'Calculado automáticamente' },
            ].map(f => (
              <div key={f.l} className="row" style={{ padding: '7px 0', borderBottom: '1px solid var(--bdr)', gap: 9 }}>
                <div style={{
                  width: 17, height: 17, borderRadius: 4,
                  background: 'var(--gold)', border: '2px solid var(--gold)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <span style={{ color: '#0B0F17', fontSize: 10, fontWeight: 900 }}>✓</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--txt-mid)' }}>{f.l}</div>
                  <div style={{ fontSize: 9, color: 'var(--txt-lo)' }}>{f.e}</div>
                </div>
                <span className="tag" style={{
                  color: 'var(--txt-lo)', background: 'transparent',
                  border: '1px solid var(--bdr)'
                }}>Fijo</span>
              </div>
            ))}
          </div>

          {/* Vista previa estampe */}
          <div className="card card-p">
            <div className="sl">Vista previa del estampe</div>
            <div style={{
              background: '#fff', color: '#111',
              borderRadius: 8, padding: '16px 22px',
              fontFamily: "'Times New Roman', serif",
              fontSize: 11.5, lineHeight: 1.8,
              border: '1px solid var(--bdr)'
            }}>
              {plantilla.nombre && (
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 1 }}>{cfg.nombre}</div>
              )}
              {plantilla.cargo && (
                <div style={{ fontSize: 11, color: '#555', marginBottom: 10 }}>Receptora Judicial</div>
              )}
              <div style={{ marginBottom: 12 }}>
                {plantilla.tribunal && (
                  <div><b style={{ minWidth: 90, display: 'inline-block' }}>TRIBUNAL</b> : <b>{cfg.tribunal}</b></div>
                )}
                {plantilla.rol && (
                  <div><b style={{ minWidth: 90, display: 'inline-block' }}>ROL</b> : <b>E-407-2026</b></div>
                )}
                {plantilla.caratulado && (
                  <div><b style={{ minWidth: 90, display: 'inline-block' }}>CARATULADO</b> : <b>MOYA / ALVARADO</b></div>
                )}
              </div>
              <div style={{ textAlign: 'justify', marginBottom: 12, fontSize: 11 }}>
                CERTIFICO: Haberme constituido en el domicilio señalado en autos,{' '}
                <strong>COSTANERA Nº 1360, LAS VENTANAS, PUCHUNCAVÍ</strong>, a fin de
                notificar a doña <strong>MARCELA KARINA ALVARADO MOYA</strong>. No fue habida. Doy fe.
              </div>
              <div style={{ fontSize: 10, marginBottom: 8 }}>
                <strong>Drs. $52.200.-</strong>
                <span style={{ margin: '0 10px', color: '#777' }}>
                  Distancia: <strong>$20.880.-</strong>
                </span>
                <span>Total: <strong>$73.080.-</strong></span>
                <span> (s/imp.)</span>
              </div>
              <div style={{
                borderTop: '1px solid #ccc', paddingTop: 8, marginTop: 8,
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-end', fontSize: 10, color: '#555'
              }}>
                <div>
                  {plantilla.email    && <div>{cfg.email}</div>}
                  {plantilla.telefono && <div>{cfg.telefono}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Firmado digitalmente por</div>
                  <div style={{ fontWeight: 700 }}>{cfg.nombre}</div>
                  <div>Fecha: {new Date().toLocaleDateString('es-CL')}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Botón guardar */}
      <div style={{ marginTop: 16 }}>
        <button
          className="btn btn-gold"
          style={{ padding: '11px 32px', fontSize: 13 }}
          onClick={guardar}
        >
          {guardado ? '✓ Guardado' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  );
}