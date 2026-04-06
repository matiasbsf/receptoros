import React, { useState } from 'react';

const EQUIPO_MOCK = [
  {
    id: 1, ini: 'PF', nombre: 'Paulina Fuentes Hevia',
    cargo: 'Receptora',
    email: 'pfhevia@gmail.com', telefono: '+56 9 6312 5974',
    color: '#C9A84C', avatar: null,
    permisos: ['Todo el sistema', 'Firma digital exclusiva', 'Configuración'],
    causas: 18, estampes: 34,
  },
  {
    id: 2, ini: 'PS', nombre: 'Patricia Soto Fuentes',
    cargo: 'Secretaria',
    email: 'psoto@receptoros.cl', telefono: '+56 9 8765 4321',
    color: '#60A5FA', avatar: null,
    permisos: ['Causas', 'Centro de Firmas (revisar)', 'Cobranza', 'Clientes (solo ver)'],
    denegados: ['Firma digital', 'Configuración'],
    causas: 0, estampes: 0,
  },
  {
    id: 3, ini: 'DA', nombre: 'Diego Araya Muñoz',
    cargo: 'Ayudante',
    email: 'daraya@receptoros.cl', telefono: '+56 9 5555 6666',
    color: '#A78BFA', avatar: null,
    permisos: ['Mi Ruta (app móvil)', 'Registrar diligencias'],
    denegados: ['Causas', 'Firmas', 'Cobranza', 'Configuración'],
    causas: 0, estampes: 0,
  },
];

export default function Equipo() {
  const [equipo, setEquipo] = useState(EQUIPO_MOCK);
  const [sel, setSel] = useState(null);

  const selUser = equipo.find(u => u.id === sel);

  return (
    <div>
      {/* Header */}
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>
            Equipo
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginTop: 2 }}>
            {equipo.length} usuarios · Gestión de permisos por rol
          </div>
        </div>
        <button className="btn btn-gold">+ Agregar usuario</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: sel ? '320px 1fr' : 'repeat(3, 1fr)', gap: 14 }}>

        {/* Cards usuarios */}
        {equipo.map(u => (
          <div
            key={u.id}
            className="card card-p"
            style={{ cursor: 'pointer', borderColor: sel === u.id ? 'var(--gold)' : 'var(--bdr)' }}
            onClick={() => setSel(sel === u.id ? null : u.id)}
          >
            {/* Avatar + info */}
            <div className="row" style={{ gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${u.color}, ${u.color}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 800, color: '#fff',
                  fontFamily: "'Manrope', sans-serif", flexShrink: 0
                }}>
                  {u.avatar ? <img src={u.avatar} alt={u.ini} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : u.ini}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); }}
                  style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--s2)', border: '1px solid var(--bdr)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 10
                  }}
                  title="Cambiar foto"
                >📷</button>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt)', marginBottom: 2 }}>
                  {u.nombre}
                </div>
                <div style={{ fontSize: 11, color: u.color, fontWeight: 600 }}>{u.cargo}</div>
              </div>
            </div>

            {/* Permisos resumen */}
            <div style={{
              background: 'var(--s2)', borderRadius: 9,
              padding: '10px 12px', marginBottom: 12
            }}>
              <div className="sl" style={{ marginBottom: 7 }}>Permisos</div>
              {u.permisos.slice(0, 3).map(p => (
                <div key={p} className="row" style={{ gap: 5, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--txt)' }}>{p}</span>
                </div>
              ))}
              {u.denegados?.slice(0, 2).map(p => (
                <div key={p} className="row" style={{ gap: 5, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--txt-mid)' }}>Sin acceso: {p}</span>
                </div>
              ))}
            </div>

            <div className="g2" style={{ gap: 6 }}>
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%' }}
                onClick={e => { e.stopPropagation(); setSel(u.id); }}
              >Editar perfil</button>
              <button
                className="btn btn-sm"
                style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-lo)', color: 'var(--gold)', width: '100%' }}
                onClick={e => { e.stopPropagation(); setSel(u.id); }}
              >Permisos</button>
            </div>
          </div>
        ))}

        {/* Panel detalle */}
        {sel && selUser && (
          <div className="card card-p">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>
                Editar — {selUser.nombre}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSel(null)}>✕</button>
            </div>

            {/* Avatar grande */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${selUser.color}, ${selUser.color}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 800, color: '#fff'
                }}>
                  {selUser.ini}
                </div>
                <button style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--gold)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 14
                }}>📷</button>
              </div>
            </div>

            {/* Datos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Nombre completo', val: selUser.nombre },
                { label: 'Email', val: selUser.email },
                { label: 'Teléfono', val: selUser.telefono },
                { label: 'Cargo', val: selUser.cargo },
              ].map(f => (
                <div key={f.label}>
                  <div className="sl" style={{ marginBottom: 4 }}>{f.label}</div>
                  <input defaultValue={f.val} />
                </div>
              ))}
            </div>

            {/* Permisos detalle */}
            <div className="sl">Permisos de acceso</div>
            <div style={{
              background: 'var(--s2)', borderRadius: 9,
              padding: 12, border: '1px solid var(--bdr)',
              marginBottom: 14
            }}>
              {[
                { mod: 'Causas', acceso: true },
                { mod: 'Centro de Firmas', acceso: selUser.cargo !== 'Ayudante' },
                { mod: 'Firma digital', acceso: selUser.cargo === 'Receptora' },
                { mod: 'Rutas', acceso: true },
                { mod: 'Cobranza', acceso: selUser.cargo !== 'Ayudante' },
                { mod: 'Clientes & Tarifas', acceso: selUser.cargo === 'Receptora' },
                { mod: 'Biblioteca de Modelos', acceso: selUser.cargo !== 'Ayudante' },
                { mod: 'Configuración', acceso: selUser.cargo === 'Receptora' },
              ].map(p => (
                <div key={p.mod} className="row" style={{ justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--bdr)' }}>
                  <span style={{ fontSize: 12, color: 'var(--txt)' }}>{p.mod}</span>
                  <div
                    style={{
                      width: 18, height: 18, borderRadius: 4,
                      border: `2px solid ${p.acceso ? 'var(--gold)' : 'var(--bdr)'}`,
                      background: p.acceso ? 'var(--gold)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all .15s'
                    }}
                  >
                    {p.acceso && <span style={{ color: '#0B0F17', fontSize: 11, fontWeight: 900 }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-gold" style={{ width: '100%', padding: '10px', fontSize: 13 }}>
              Guardar cambios
            </button>
          </div>
        )}
      </div>
    </div>
  );
}