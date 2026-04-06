import React, { useState } from 'react';

const CLIENTES_MOCK = [
  {
    id: 1, nombre: 'ASINVERCO', tipo: 'Estudio Jurídico',
    carteras: ['Banco Santander', 'Banco de Chile'],
    cierreMin: 5, impuesto: 'cliente', boleta: 'cartera',
    causasActivas: 18,
    tarifas: {
      'Banco Santander': [
        { tipo: 'Notificación Personal', neto: 85000, distancia: 25000 },
        { tipo: 'Notificación por Cédula', neto: 65000, distancia: 20000 },
        { tipo: 'Requerimiento de Pago', neto: 95000, distancia: 30000 },
        { tipo: 'Embargo', neto: 180000, distancia: 50000 },
      ],
      'Banco de Chile': [
        { tipo: 'Notificación Personal', neto: 80000, distancia: 25000 },
        { tipo: 'Notificación por Cédula', neto: 60000, distancia: 20000 },
        { tipo: 'Requerimiento de Pago', neto: 90000, distancia: 30000 },
        { tipo: 'Embargo', neto: 175000, distancia: 50000 },
      ],
    }
  },
  {
    id: 2, nombre: 'ORPRO', tipo: 'Cartera',
    carteras: ['Banco de Chile', 'Banco Santander'],
    cierreMin: 1, impuesto: 'receptor', boleta: 'cartera',
    causasActivas: 12,
    tarifas: {
      'Banco de Chile': [
        { tipo: 'Notificación Personal', neto: 80000, distancia: 25000 },
        { tipo: 'Requerimiento de Pago', neto: 90000, distancia: 30000 },
      ],
    }
  },
  {
    id: 3, nombre: 'González & Asoc.', tipo: 'Abogado Independiente',
    carteras: ['—'], cierreMin: null,
    impuesto: 'cliente', boleta: 'individual',
    causasActivas: 4, tarifas: {}
  },
];

const IVA = 0.19;

export default function Clientes() {
  const [clientes, setClientes] = useState(CLIENTES_MOCK);
  const [sel, setSel] = useState(null);
  const [carteraActiva, setCarteraActiva] = useState(null);
  const [showCopiar, setShowCopiar] = useState(false);

  const selClient = clientes.find(c => c.id === sel);

  const toggleImpuesto = (id, val) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, impuesto: val } : c));
  };

  const toggleBoleta = (id, val) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, boleta: val } : c));
  };

  return (
    <div>
      {/* Header */}
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>
            Clientes & Tarifas
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginTop: 2 }}>
            Cliente → Cartera → Causa · 3 niveles
          </div>
        </div>
        <button className="btn btn-gold">+ Nuevo Cliente</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: sel ? '280px 1fr' : 'repeat(3, 1fr)', gap: 14 }}>

        {/* Lista clientes */}
        {clientes.map(cl => (
          <div
            key={cl.id}
            className="card card-p"
            style={{ cursor: 'pointer', borderColor: sel === cl.id ? 'var(--gold)' : 'var(--bdr)' }}
            onClick={() => {
              setSel(sel === cl.id ? null : cl.id);
              setCarteraActiva(cl.carteras[0]);
              setShowCopiar(false);
            }}
          >
            <div className="row" style={{ gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'var(--gold-bg)', border: '1px solid var(--gold-ring)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 16, fontWeight: 700, color: 'var(--gold)', flexShrink: 0
              }}>
                {cl.nombre.slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row" style={{ gap: 5, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--txt)' }}>{cl.nombre}</span>
                  <span className="tag" style={{
                    color: cl.tipo === 'Abogado Independiente' ? 'var(--green)' : cl.tipo === 'Cartera' ? 'var(--blue)' : 'var(--violet)',
                    background: cl.tipo === 'Abogado Independiente' ? 'var(--green-bg)' : cl.tipo === 'Cartera' ? 'var(--blue-bg)' : 'var(--violet-bg)',
                    border: `1px solid ${cl.tipo === 'Abogado Independiente' ? 'rgba(52,211,153,.3)' : cl.tipo === 'Cartera' ? 'rgba(96,165,250,.3)' : 'rgba(167,139,250,.3)'}`
                  }}>
                    {cl.tipo}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--txt-mid)', marginBottom: 6 }}>
                  {cl.carteras.join(' · ')}
                </div>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, color: 'var(--txt-lo)' }}>
                    <strong style={{ color: 'var(--txt)' }}>{cl.causasActivas}</strong> causas
                  </span>
                  {cl.cierreMin && (
                    <span style={{ fontSize: 9, color: 'var(--txt-lo)' }}>
                      Cierre día <strong style={{ color: 'var(--amber)' }}>{cl.cierreMin}</strong>
                    </span>
                  )}
                  <span className="tag" style={{
                    color: cl.impuesto === 'cliente' ? 'var(--green)' : 'var(--amber)',
                    background: cl.impuesto === 'cliente' ? 'var(--green-bg)' : 'var(--amber-bg)',
                    border: `1px solid ${cl.impuesto === 'cliente' ? 'rgba(52,211,153,.3)' : 'rgba(251,191,36,.3)'}`
                  }}>
                    Imp: {cl.impuesto}
                  </span>
                  {cl.boleta === 'cartera' && (
                    <span className="tag" style={{ color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid rgba(96,165,250,.3)' }}>
                      1 boleta/cartera
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Panel detalle */}
        {sel && selClient && (
          <div className="card card-p">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>
                  {selClient.nombre}
                </div>
                <span className="tag" style={{ color: 'var(--violet)', background: 'var(--violet-bg)', border: '1px solid rgba(167,139,250,.3)' }}>
                  {selClient.tipo}
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSel(null)}>✕</button>
            </div>

            {/* Alerta independiente */}
            {selClient.tipo === 'Abogado Independiente' && (
              <div className="alert alert-amber" style={{ marginBottom: 12 }}>
                <span>💡</span>
                <span style={{ fontSize: 11, color: 'var(--amber)' }}>
                  Cliente independiente — se sugiere aplicar el arancel oficial del receptor
                </span>
              </div>
            )}

            {/* Toggle impuesto */}
            <div style={{
              padding: '10px 14px', background: 'var(--s2)',
              borderRadius: 9, border: '1px solid var(--bdr)',
              marginBottom: 12
            }}>
              <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt)' }}>¿Quién paga el impuesto?</div>
                  <div style={{ fontSize: 9, color: 'var(--txt-mid)', marginTop: 2 }}>Afecta el cálculo neto del estampe</div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  {['cliente', 'receptor'].map(op => (
                    <button
                      key={op}
                      className="btn btn-sm"
                      style={{
                        border: `1px solid ${selClient.impuesto === op ? 'var(--gold)' : 'var(--bdr)'}`,
                        background: selClient.impuesto === op ? 'var(--gold-bg)' : 'transparent',
                        color: selClient.impuesto === op ? 'var(--gold)' : 'var(--txt-mid)',
                      }}
                      onClick={() => toggleImpuesto(sel, op)}
                    >
                      {op.charAt(0).toUpperCase() + op.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggle boleta */}
            <div style={{
              padding: '10px 14px', background: 'var(--s2)',
              borderRadius: 9, border: '1px solid var(--bdr)',
              marginBottom: 14
            }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                <div
                  onClick={() => toggleBoleta(sel, selClient.boleta === 'cartera' ? 'individual' : 'cartera')}
                  style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${selClient.boleta === 'cartera' ? 'var(--gold)' : 'var(--bdr)'}`,
                    background: selClient.boleta === 'cartera' ? 'var(--gold)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, cursor: 'pointer', transition: 'all .15s'
                  }}
                >
                  {selClient.boleta === 'cartera' && (
                    <span style={{ color: '#0B0F17', fontSize: 11, fontWeight: 900 }}>✓</span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: 'var(--txt)' }}>
                  1 boleta por toda la cartera al cierre del proceso
                </span>
              </label>
            </div>

            {/* Tarifas */}
            <div className="sl">Tarifas por cartera</div>

            {/* Botones acciones */}
            <div className="row" style={{ gap: 8, marginBottom: 12 }}>
              <button
                className="btn btn-blue btn-sm"
                onClick={() => setShowCopiar(!showCopiar)}
              >
                📋 Copiar tarifas de otro cliente
              </button>
              <button className="btn btn-ghost btn-sm">📊 Subir Excel</button>
            </div>

            {/* Copiar tarifas */}
            {showCopiar && (
              <div style={{
                background: 'var(--s2)', borderRadius: 9,
                padding: 12, border: '1px solid var(--bdr)', marginBottom: 12
              }}>
                <div style={{ fontSize: 10, color: 'var(--txt-mid)', marginBottom: 7 }}>
                  Selecciona el cliente del que copiar:
                </div>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {clientes
                    .filter(c => c.id !== sel)
                    .flatMap(c => c.carteras.filter(ca => ca !== '—').map(ca => (
                      <button
                        key={c.nombre + ca}
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowCopiar(false)}
                      >
                        {c.nombre} → {ca}
                      </button>
                    )))
                  }
                </div>
              </div>
            )}

            {/* Tabs carteras */}
            {selClient.carteras.filter(c => c !== '—').length > 0 && (
              <>
                <div className="row" style={{ gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  {selClient.carteras.filter(c => c !== '—').map(ca => (
                    <button
                      key={ca}
                      className="btn btn-sm"
                      style={{
                        border: `1px solid ${carteraActiva === ca ? 'var(--gold)' : 'var(--bdr)'}`,
                        background: carteraActiva === ca ? 'var(--gold-bg)' : 'transparent',
                        color: carteraActiva === ca ? 'var(--gold)' : 'var(--txt-mid)',
                      }}
                      onClick={() => setCarteraActiva(ca)}
                    >{ca}</button>
                  ))}
                </div>

                {/* Tabla tarifas */}
                {carteraActiva && selClient.tarifas[carteraActiva] && (
                  <div style={{ background: 'var(--s2)', borderRadius: 9, overflow: 'hidden', border: '1px solid var(--bdr)' }}>
                    <div style={{
                      padding: '8px 12px', borderBottom: '1px solid var(--bdr)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt)' }}>{carteraActiva}</span>
                      <button className="btn btn-sm" style={{ background: 'var(--gold-bg)', border: 'none', color: 'var(--gold)' }}>
                        + Tarifa
                      </button>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          {['Diligencia', 'Valor neto', 'Distancia', 'Total s/imp.', 'Total c/imp.'].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selClient.tarifas[carteraActiva].map((t, i) => {
                          const total = t.neto + t.distancia;
                          const totalIva = Math.round(total * (1 + IVA));
                          return (
                            <tr key={i} style={{ background: i % 2 ? 'var(--s0, rgba(17,23,32,.5))' : 'transparent' }}>
                              <td style={{ color: 'var(--txt)' }}>{t.tipo}</td>
                              <td style={{ fontWeight: 700, color: 'var(--green)' }}>
                                ${t.neto.toLocaleString('es-CL')}
                              </td>
                              <td style={{ color: 'var(--amber)' }}>
                                ${t.distancia.toLocaleString('es-CL')}
                              </td>
                              <td style={{ fontWeight: 700 }}>
                                ${total.toLocaleString('es-CL')}
                              </td>
                              <td style={{ fontWeight: 800, color: 'var(--blue)' }}>
                                ${totalIva.toLocaleString('es-CL')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {selClient.tipo === 'Abogado Independiente' && (
              <div style={{
                textAlign: 'center', padding: 24,
                color: 'var(--txt-mid)', fontSize: 12
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                Se aplicará el arancel oficial del receptor
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}