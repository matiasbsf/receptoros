import React, { useState } from 'react';

const BOLETAS_MOCK = [
  {
    id: 'B-0045', cliente: 'ASINVERCO', cartera: 'Banco Santander',
    causas: 7, monto: 665000, estado: 'Pendiente de Pago', vence: '05/05/2025'
  },
  {
    id: 'B-0046', cliente: 'ORPRO', cartera: 'Banco de Chile',
    causas: 4, monto: 390000, estado: 'Enviado a Cobro', vence: '01/04/2025'
  },
  {
    id: 'B-0047', cliente: 'González & Asoc.', cartera: '—',
    causas: 1, monto: 65000, estado: 'Pagado', vence: '—'
  },
  {
    id: 'B-0048', cliente: 'ASINVERCO', cartera: 'Banco de Chile',
    causas: 5, monto: 475000, estado: 'Pendiente de Pago', vence: '05/05/2025'
  },
];

const CIERRES_MOCK = [
  { cliente: 'ASINVERCO', cartera: 'Banco Santander', dia: 5, causas: 7, monto: 665000, diasRestantes: 29 },
  { cliente: 'ASINVERCO', cartera: 'Banco de Chile',  dia: 5, causas: 5, monto: 475000, diasRestantes: 29 },
  { cliente: 'ORPRO',     cartera: 'Banco de Chile',  dia: 1, causas: 4, monto: 390000, diasRestantes: 25 },
];

function estadoColor(e) {
  const map = {
    'Pagado':           { c: 'var(--green)',  bg: 'var(--green-bg)'  },
    'Enviado a Cobro':  { c: 'var(--violet)', bg: 'var(--violet-bg)' },
    'Pendiente de Pago':{ c: 'var(--amber)',  bg: 'var(--amber-bg)'  },
  };
  return map[e] || { c: 'var(--txt-mid)', bg: 'var(--s2)' };
}

function Badge({ estado }) {
  const { c, bg } = estadoColor(estado);
  return (
    <span className="badge" style={{ color: c, background: bg, border: `1px solid ${c}33` }}>
      <span className="bdot" style={{ background: c }} />
      {estado}
    </span>
  );
}

export default function Cobranza() {
  const [boletas, setBoletas] = useState(BOLETAS_MOCK);
  const [filtro, setFiltro] = useState('Todos');

  const total    = boletas.reduce((s, b) => s + b.monto, 0);
  const porCobrar= boletas.filter(b => b.estado !== 'Pagado').reduce((s, b) => s + b.monto, 0);
  const cobrado  = boletas.filter(b => b.estado === 'Pagado').reduce((s, b) => s + b.monto, 0);

  const filtradas = filtro === 'Todos'
    ? boletas
    : boletas.filter(b => b.estado === filtro);

  return (
    <div>
      {/* Header */}
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>
            Cobranza
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginTop: 2 }}>
            Automática · Cierre por cartera · Estados unificados
          </div>
        </div>
        <button className="btn btn-gold">+ Nueva Boleta</button>
      </div>

      {/* Stats */}
      <div className="g3" style={{ marginBottom: 14 }}>
        <div className="statcard">
          <div className="sl">Total emitido</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>
            ${total.toLocaleString('es-CL')}
          </div>
        </div>
        <div className="statcard" style={{ background: 'var(--amber-bg)', borderColor: 'rgba(251,191,36,.3)' }}>
          <div className="sl">Por cobrar</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--amber)' }}>
            ${porCobrar.toLocaleString('es-CL')}
          </div>
        </div>
        <div className="statcard" style={{ background: 'var(--green-bg)', borderColor: 'rgba(52,211,153,.3)' }}>
          <div className="sl">Cobrado</div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--green)' }}>
            ${cobrado.toLocaleString('es-CL')}
          </div>
        </div>
      </div>

      {/* Próximos cierres */}
      <div className="card card-p" style={{ marginBottom: 14 }}>
        <div className="sl">Próximos cierres automáticos</div>
        <div className="g2">
          {CIERRES_MOCK.map((c, i) => (
            <div key={i} style={{
              padding: 14, background: 'var(--s2)',
              borderRadius: 10, border: '1px solid var(--bdr)',
              display: 'flex', gap: 12, alignItems: 'center'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--gold-bg)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 18, flexShrink: 0
              }}>🗓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>{c.cliente}</div>
                <div style={{ fontSize: 10, color: 'var(--txt-mid)' }}>{c.cartera} · {c.causas} causas</div>
                <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700 }}>
                  ${c.monto.toLocaleString('es-CL')}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--txt-mid)' }}>Día {c.dia}</div>
                <div style={{
                  fontSize: 10,
                  color: c.diasRestantes <= 10 ? 'var(--red)' : 'var(--amber)'
                }}>
                  en {c.diasRestantes} días
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        {['Todos', 'Pendiente de Pago', 'Enviado a Cobro', 'Pagado'].map(e => (
          <button
            key={e}
            className="btn btn-ghost btn-sm"
            style={filtro === e ? {
              borderColor: 'var(--gold)',
              color: 'var(--gold)',
              background: 'var(--gold-bg)'
            } : {}}
            onClick={() => setFiltro(e)}
          >{e}</button>
        ))}
      </div>

      {/* Tabla boletas */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table>
          <thead>
            <tr>
              {['Boleta', 'Cliente', 'Cartera', 'Causas', 'Monto', 'Vence', 'Estado', ''].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.map((b, i) => (
              <tr key={b.id} style={{ background: i % 2 ? 'var(--s2, rgba(28,38,56,.3))' : 'transparent' }}>
                <td style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
                  {b.id}
                </td>
                <td style={{ fontWeight: 600, color: 'var(--txt)' }}>{b.cliente}</td>
                <td style={{ color: 'var(--txt-mid)' }}>{b.cartera}</td>
                <td style={{ textAlign: 'center', color: 'var(--txt-mid)' }}>{b.causas}</td>
                <td style={{ fontWeight: 800 }}>${b.monto.toLocaleString('es-CL')}</td>
                <td style={{ color: 'var(--txt-mid)', fontSize: 10, fontFamily: "'DM Mono', monospace" }}>
                  {b.vence}
                </td>
                <td><Badge estado={b.estado} /></td>
                <td>
                  <div className="row" style={{ gap: 4 }}>
                    <button className="btn btn-ghost btn-sm">PDF</button>
                    <button className="btn btn-ghost btn-sm">XLS</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtradas.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--txt-mid)' }}>
            No hay boletas en este estado
          </div>
        )}
      </div>
    </div>
  );
}