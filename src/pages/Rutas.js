import React, { useState } from 'react';

const RUTA_MOCK = [
  {
    id: 1, orden: 1, rol: 'C-4444-2025',
    demandado: 'Rosa Medina Soto',
    dir: 'Av. Providencia 1890', comuna: 'Providencia',
    tipo: 'Notificación Cédula', estado: 'pendiente',
    historial: { fecha: '15/03/2025', resultado: 'Negativa' }
  },
  {
    id: 2, orden: 2, rol: 'C-1234-2025',
    demandado: 'Juan Pérez López',
    dir: 'Av. Providencia 1234, Dpto 5', comuna: 'Providencia',
    tipo: 'Notificación Personal', estado: 'pendiente',
    historial: null
  },
  {
    id: 3, orden: 3, rol: 'L-0912-2025',
    demandado: 'Ana Torres Vega',
    dir: 'Irarrázaval 2345', comuna: 'Ñuñoa',
    tipo: 'Embargo', estado: 'pendiente',
    historial: null
  },
  {
    id: 4, orden: 4, rol: 'C-9999-2025',
    demandado: 'Sofía Ramos',
    dir: 'Irarrázaval 890', comuna: 'Ñuñoa',
    tipo: 'Notificación Personal', estado: 'pendiente',
    historial: { fecha: '02/02/2025', resultado: 'Positiva' }
  },
  {
    id: 5, orden: 5, rol: 'C-3456-2025',
    demandado: 'Luis Vargas Rojas',
    dir: 'Teatinos 120, piso 3', comuna: 'Santiago',
    tipo: 'Requerimiento', estado: 'completada',
    historial: null
  },
];

export default function Rutas() {
  const [causas, setCausas] = useState(RUTA_MOCK);
  const [partida, setPartida] = useState('oficina');
  const [recalc, setRecalc] = useState(false);

  const pendientes = causas.filter(c => c.estado === 'pendiente');
  const completadas = causas.filter(c => c.estado === 'completada');

  const grupos = [
    { zona: 'Providencia', color: 'var(--blue)',   causas: pendientes.filter(c => c.comuna === 'Providencia') },
    { zona: 'Ñuñoa',       color: 'var(--green)',  causas: pendientes.filter(c => c.comuna === 'Ñuñoa') },
    { zona: 'Santiago',    color: 'var(--violet)', causas: pendientes.filter(c => c.comuna === 'Santiago') },
  ].filter(g => g.causas.length > 0);

  const simRecalc = () => {
    setRecalc(true);
    setTimeout(() => setRecalc(false), 1500);
  };

  const markDone = (id) => {
    setCausas(prev => prev.map(c => c.id === id ? { ...c, estado: 'completada' } : c));
  };

  const moveUp = (id) => {
    const idx = causas.findIndex(c => c.id === id);
    if (idx <= 0) return;
    const arr = [...causas];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    setCausas(arr.map((c, i) => ({ ...c, orden: i + 1 })));
  };

  const openMaps = (dir, comuna, app) => {
    const q = encodeURIComponent(`${dir}, ${comuna}, Chile`);
    const url = app === 'gmaps'
      ? `https://www.google.com/maps/search/?api=1&query=${q}`
      : `https://waze.com/ul?q=${q}&navigate=yes`;
    window.open(url, '_blank');
  };

  const openRouteAll = (app) => {
    const dirs = pendientes.map(c => encodeURIComponent(`${c.dir}, ${c.comuna}, Chile`));
    if (app === 'gmaps') {
      window.open(`https://www.google.com/maps/dir/${dirs.join('/')}`, '_blank');
    } else {
      window.open(`https://waze.com/ul?q=${dirs[0]}&navigate=yes`, '_blank');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>
            Ruta del Día
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginTop: 2 }}>
            {pendientes.length} pendientes · {completadas.length} completadas · Actualización automática
          </div>
        </div>
        <button
          className="btn btn-sm"
          style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-lo)', color: 'var(--gold)' }}
          onClick={simRecalc}
        >
          {recalc ? <span className="spin">⚙</span> : '↺'} Recalcular ruta
        </button>
      </div>

      {/* Punto de partida + grupos */}
      <div className="g2" style={{ marginBottom: 14 }}>
        <div className="card card-p">
          <div className="sl">Punto de partida</div>
          <div className="row" style={{ marginBottom: 10, gap: 6 }}>
            {[
              { k: 'casa',     l: '🏠 Casa' },
              { k: 'oficina',  l: '🏢 Oficina' },
              { k: 'tribunal', l: '⚖ Tribunal' },
            ].map(o => (
              <button
                key={o.k}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  border: `1px solid ${partida === o.k ? 'var(--gold)' : 'var(--bdr)'}`,
                  background: partida === o.k ? 'var(--gold-bg)' : 'transparent',
                  color: partida === o.k ? 'var(--gold)' : 'var(--txt-mid)',
                }}
                onClick={() => setPartida(o.k)}
              >{o.l}</button>
            ))}
          </div>
          <div style={{
            fontSize: 11, color: 'var(--txt-mid)',
            padding: '7px 10px', background: 'var(--s2)', borderRadius: 7
          }}>
            {partida === 'casa' && 'Salida desde domicilio del receptor'}
            {partida === 'oficina' && 'Salida desde oficina — Av. Independencia 1234'}
            {partida === 'tribunal' && 'Salida desde Juzgado de Letras y Garantía de Quintero'}
          </div>
        </div>

        <div className="card card-p">
          <div className="sl">Grupos por cercanía geográfica</div>
          {grupos.map(g => (
            <div key={g.zona} style={{
              display: 'flex', gap: 8, alignItems: 'center',
              padding: '7px 10px',
              background: g.color + '10',
              border: `1px solid ${g.color}33`,
              borderRadius: 8, marginBottom: 6
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt)' }}>{g.zona}</div>
                <div style={{ fontSize: 9, color: 'var(--txt-mid)' }}>{g.causas.length} causas agrupadas</div>
              </div>
              <span className="tag" style={{ color: g.color, background: g.color + '18', border: `1px solid ${g.color}33` }}>
                {g.causas.length}
              </span>
            </div>
          ))}
          <div style={{ fontSize: 9, color: 'var(--txt-lo)', marginTop: 6 }}>
            💡 Domicilios similares agrupados para evitar doble viaje
          </div>
        </div>
      </div>

      {/* Exportar a apps */}
      <div className="card card-p" style={{ marginBottom: 14 }}>
        <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>
              Exportar ruta completa
            </div>
            <div style={{ fontSize: 10, color: 'var(--txt-mid)' }}>
              {pendientes.length} paradas en orden optimizado
            </div>
          </div>
          <button
            onClick={() => openRouteAll('gmaps')}
            style={{
              background: '#4285F4', border: 'none', borderRadius: 9,
              padding: '9px 16px', color: '#fff', fontSize: 12,
              fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7
            }}
          >
            📍 Google Maps
          </button>
          <button
            onClick={() => openRouteAll('waze')}
            style={{
              background: '#33CCFF', border: 'none', borderRadius: 9,
              padding: '9px 16px', color: '#fff', fontSize: 12,
              fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7
            }}
          >
            🚗 Waze
          </button>
        </div>
      </div>

      {/* Recalculando */}
      {recalc && (
        <div className="alert alert-blue" style={{ marginBottom: 12 }}>
          <span className="spin" style={{ fontSize: 14 }}>⚙</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>
            Recalculando ruta óptima por cercanía...
          </span>
        </div>
      )}

      {/* Punto de partida */}
      <div style={{
        padding: '10px 14px',
        background: 'var(--gold-bg)',
        border: '1px solid var(--gold-ring)',
        borderRadius: 10,
        display: 'flex', gap: 10, alignItems: 'center',
        marginBottom: 8
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--gold)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 13, flexShrink: 0
        }}>
          {partida === 'casa' ? '🏠' : partida === 'oficina' ? '🏢' : '⚖'}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)' }}>Punto de partida</div>
          <div style={{ fontSize: 9, color: 'var(--txt-mid)' }}>
            {partida === 'casa' && 'Domicilio del receptor'}
            {partida === 'oficina' && 'Oficina'}
            {partida === 'tribunal' && 'Tribunal Quintero'}
          </div>
        </div>
      </div>

      {/* Lista de paradas */}
      {causas.map((c, i) => {
        const isPend = c.estado === 'pendiente';
        return (
          <div
            key={c.id}
            style={{
              background: isPend ? 'var(--s1)' : 'var(--s0)',
              border: `1px solid ${c.historial && isPend
                ? (c.historial.resultado === 'Negativa' ? 'rgba(248,113,113,.4)' : 'rgba(52,211,153,.4)')
                : 'var(--bdr)'}`,
              borderRadius: 10, padding: '11px 14px',
              opacity: isPend ? 1 : 0.6,
              transition: 'all .3s', marginBottom: 8
            }}
          >
            {/* Alerta historial */}
            {c.historial && isPend && (
              <div style={{
                background: c.historial.resultado === 'Negativa' ? 'var(--red-bg)' : 'var(--green-bg)',
                border: `1px solid ${c.historial.resultado === 'Negativa' ? 'rgba(248,113,113,.3)' : 'rgba(52,211,153,.3)'}`,
                borderRadius: 7, padding: '4px 9px',
                marginBottom: 8,
                display: 'flex', gap: 5, alignItems: 'center'
              }}>
                <span style={{ fontSize: 12 }}>
                  {c.historial.resultado === 'Negativa' ? '⚠️' : '✅'}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: c.historial.resultado === 'Negativa' ? 'var(--red)' : 'var(--green)'
                }}>
                  Visita previa {c.historial.fecha} · {c.historial.resultado}
                </span>
              </div>
            )}

            <div className="row" style={{ gap: 10 }}>
              {/* Número orden */}
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: isPend ? 'var(--s3, #243044)' : 'var(--green-bg)',
                border: `1.5px solid ${isPend ? 'var(--bdr)' : 'var(--green)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800,
                color: isPend ? 'var(--txt-mid)' : 'var(--green)'
              }}>
                {isPend ? c.orden : '✓'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt)', marginBottom: 1 }}>
                  {c.demandado}
                </div>
                <div style={{ fontSize: 10, color: 'var(--txt-mid)' }}>
                  📍 {c.dir}, {c.comuna} ·{' '}
                  <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--gold)' }}>
                    {c.rol}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              {isPend && (
                <div className="row" style={{ gap: 5, flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => moveUp(c.id)}
                    disabled={i === 0}
                    style={{ opacity: i === 0 ? 0.4 : 1 }}
                  >↑</button>
                  <button
                    onClick={() => openMaps(c.dir, c.comuna, 'gmaps')}
                    style={{
                      background: '#4285F4', border: 'none',
                      borderRadius: 6, padding: '3px 8px',
                      color: '#fff', fontSize: 10,
                      fontWeight: 700, cursor: 'pointer'
                    }}
                  >G</button>
                  <button
                    onClick={() => openMaps(c.dir, c.comuna, 'waze')}
                    style={{
                      background: '#33CCFF', border: 'none',
                      borderRadius: 6, padding: '3px 8px',
                      color: '#fff', fontSize: 10,
                      fontWeight: 700, cursor: 'pointer'
                    }}
                  >W</button>
                  <button
                    className="btn btn-green btn-sm"
                    onClick={() => markDone(c.id)}
                  >✓ Listo</button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Fin ruta */}
      <div style={{
        padding: '9px 14px', background: 'var(--s0)',
        border: '1px solid var(--bdr)', borderRadius: 10,
        display: 'flex', gap: 8, alignItems: 'center', opacity: .5
      }}>
        <span style={{ fontSize: 16 }}>🏁</span>
        <span style={{ fontSize: 11, color: 'var(--txt-lo)' }}>Fin de ruta</span>
      </div>
    </div>
  );
}