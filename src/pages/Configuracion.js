import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const CORTES = [
  'C.A. de Valparaíso', 'C.A. de Santiago', 'C.A. de San Miguel',
  'C.A. de Concepción', 'C.A. de Temuco', 'C.A. de Antofagasta',
  'C.A. de Iquique', 'C.A. de La Serena', 'C.A. de Rancagua',
  'C.A. de Talca', 'C.A. de Chillán', 'C.A. de Puerto Montt',
  'C.A. de Coihaique', 'C.A. de Punta Arenas', 'C.A. de Arica',
];

const TRIBUNALES = [
  'Juzgado de Letras y Garantía de Quintero',
  'Juzgado de Letras y Garantía de La Ligua',
  'Juzgado de Letras y Garantía de Petorca',
  '1° Juzgado Civil de Valparaíso',
  '2° Juzgado Civil de Valparaíso',
  'Juzgado de Letras y Garantía de Casablanca',
  'Juzgado de Letras y Garantía de San Antonio',
  'Juzgado de Letras de Viña del Mar',
  '1° Juzgado Civil de Santiago',
  '2° Juzgado Civil de Santiago',
  '3° Juzgado Civil de Santiago',
  'Juzgado Laboral de Santiago',
];

export default function Configuracion() {
  const { theme, toggleTheme } = useTheme();

  const [cfg, setCfg] = useState({
    nombre: 'Paulina Fuentes Hevia',
    email: 'pfhevia@gmail.com',
    telefono: '+56 9 6312 5974',
    sitioWeb: 'www.receptorquintero.cl',
    corte: 'C.A. de Valparaíso',
    tribunal: 'Juzgado de Letras y Garantía de Quintero',
    comunaAsiento: 'Quintero',
    tasaRetencion: '10,75',
  });

  const [plantilla, setPlantilla] = useState({
    nombre: true, cargo: true, tribunal: true,
    rol: true, caratulado: true,
    email: true, telefono: true,
  });

  const [guardado, setGuardado] = useState(false);

  const setC = k => e => setCfg(p => ({ ...p, [k]: e.target.value }));
  const toggleP = k => setPlantilla(p => ({ ...p, [k]: !p[k] }));

  const guardar = () => {
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
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

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>
          Configuración
        </div>
        <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginTop: 2 }}>
          Datos personales, judiciales y preferencias del sistema
        </div>
      </div>

      <div className="g2" style={{ gap: 14 }}>

        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Datos personales */}
          <div className="card card-p">
            <div className="sl">Datos personales</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Nombre completo', key: 'nombre' },
                { label: 'Email', key: 'email' },
                { label: 'Teléfono', key: 'telefono' },
                { label: 'Sitio web', key: 'sitioWeb' },
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
                <select value={cfg.corte} onChange={setC('corte')}>
                  {CORTES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="sl" style={{ marginBottom: 4 }}>Tribunal de origen</div>
                <select value={cfg.tribunal} onChange={setC('tribunal')}>
                  {TRIBUNALES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div className="sl" style={{ marginBottom: 4 }}>Comuna de asiento del tribunal</div>
                <input value={cfg.comunaAsiento} onChange={setC('comunaAsiento')} placeholder="Quintero" />
              </div>
            </div>
          </div>

          {/* Parámetros tributarios */}
          <div className="card card-p">
            <div className="sl">Parámetros tributarios</div>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>
                  Tasa de retención de honorarios
                </div>
                <div style={{ fontSize: 9, color: 'var(--txt-mid)', marginTop: 2 }}>
                  Actualiza cuando el SII lo modifique · Historial disponible
                </div>
              </div>
              <div className="row" style={{ gap: 7, alignItems: 'center' }}>
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
            {/* Historial tasas */}
            <div style={{ background: 'var(--s2)', borderRadius: 8, padding: 10, border: '1px solid var(--bdr)' }}>
              <div className="sl" style={{ marginBottom: 7 }}>Historial</div>
              {[
                { tasa: '10,75%', desde: 'Ene 2024', hasta: 'Hoy', vigente: true },
                { tasa: '10,75%', desde: 'Ene 2023', hasta: 'Dic 2023', vigente: false },
                { tasa: '10,75%', desde: 'Ene 2022', hasta: 'Dic 2022', vigente: false },
              ].map((h, i) => (
                <div key={i} className="row" style={{ justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--bdr)', fontSize: 11 }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{h.tasa}</span>
                  <span style={{ color: 'var(--txt-mid)' }}>{h.desde} → {h.hasta}</span>
                  {h.vigente && (
                    <span className="tag" style={{ color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid rgba(52,211,153,.3)' }}>
                      Vigente
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Apariencia */}
          <div className="card card-p">
            <div className="sl">Apariencia</div>
            <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 12 }}>
              Preferencia personal de tema — cada usuario elige la suya
            </div>
            <div className="g2" style={{ gap: 10 }}>
              {[
                { k: 'dark',  l: '🌙 Oscuro',  bg: '#0B0F17', txt: '#E2EAF8' },
                { k: 'light', l: '☀️ Claro',   bg: '#F4F6FA', txt: '#1A2340' },
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
                    background: t.bg,
                    border: '1px solid rgba(128,128,128,.3)',
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
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Configuración del estampe */}
          <div className="card card-p">
            <div className="sl">Configuración del estampe</div>
            <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 12 }}>
              Encabezado y pie · Firma y precio siempre incluidos
            </div>

            {/* Encabezado */}
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

            {/* Pie */}
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

            {/* Fijos */}
            {[
              { l: 'Firma digital', e: 'Siempre incluida · No configurable' },
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
                <span className="tag" style={{ color: 'var(--txt-lo)', background: 'transparent', border: '1px solid var(--bdr)' }}>
                  Fijo
                </span>
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
                {plantilla.tribunal && <div><b style={{ minWidth: 90, display: 'inline-block' }}>TRIBUNAL</b> : <b>{cfg.tribunal}</b></div>}
                {plantilla.rol && <div><b style={{ minWidth: 90, display: 'inline-block' }}>ROL</b> : <b>E-407-2026</b></div>}
                {plantilla.caratulado && <div><b style={{ minWidth: 90, display: 'inline-block' }}>CARATULADO</b> : <b>MOYA / ALVARADO</b></div>}
              </div>
              <div style={{ textAlign: 'justify', marginBottom: 12, fontSize: 11 }}>
                CERTIFICO: Haberme constituido en el domicilio señalado en autos, <strong>COSTANERA Nº 1360, LAS VENTANAS, PUCHUNCAVÍ</strong>, a fin de notificar a doña <strong>MARCELA KARINA ALVARADO MOYA</strong>. No fue habida. Doy fe.
              </div>
              <div style={{ fontSize: 10, marginBottom: 8 }}>
                <strong>Drs. $85.000.-</strong>
                <span style={{ margin: '0 10px', color: '#777' }}>Distancia: <strong>$25.000.-</strong></span>
                <span>Total: <strong>$110.000.-</strong></span>
                <span> (s/imp.)</span>
              </div>
              <div style={{
                borderTop: '1px solid #ccc', paddingTop: 8, marginTop: 8,
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-end', fontSize: 10, color: '#555'
              }}>
                <div>
                  {plantilla.email && <div>{cfg.email}</div>}
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