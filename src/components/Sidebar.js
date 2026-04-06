import React, { useState } from 'react';

const NAV = [
  { k: 'causas',   icon: '⚖',  label: 'Causas' },
  { k: 'firmas',   icon: '✍',  label: 'Firmas' },
  { k: 'rutas',    icon: '🗺',  label: 'Rutas' },
  { k: 'cobranza', icon: '🧾', label: 'Cobranza' },
];

const CONFIG_SUB = [
  { k: 'clientes',      icon: '🏢', label: 'Clientes' },
  { k: 'modelos',       icon: '📋', label: 'Modelos' },
  { k: 'equipo',        icon: '👥', label: 'Equipo' },
  { k: 'configuracion', icon: '🔧', label: 'Datos' },
];

export default function Sidebar({ screen, setScreen }) {
  const [collapsed, setCollapsed] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const isConfigActive = CONFIG_SUB.some(s => s.k === screen);

  const handleNav = (k) => {
    setScreen(k);
    if (!CONFIG_SUB.some(s => s.k === k)) {
      setConfigOpen(false);
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'closed' : 'open'}`}>
      {/* Toggle */}
    <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--bdr)',
        padding: '12px', cursor: 'pointer',
        color: 'var(--txt-mid)', fontSize: 14,
        width: '100%', display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-end',
        paddingRight: collapsed ? undefined : 14
    }}
    >
    {collapsed ? '→' : '←'}
    </button>

      {/* Nav principal */}
      <div style={{ padding: '8px 0' }}>
        {NAV.map(n => (
          <button
            key={n.k}
            className={`sb-btn ${screen === n.k ? 'active' : ''}`}
            onClick={() => handleNav(n.k)}
          >
            <span className="sb-icon">{n.icon}</span>
            <span className="sb-label">{n.label}</span>
          </button>
        ))}
      </div>

      <div className="sb-divider" />

      {/* Configuración */}
      <button
        className={`sb-btn ${isConfigActive ? 'active' : ''}`}
        onClick={() => setConfigOpen(!configOpen)}
      >
        <span className="sb-icon">⚙</span>
        <span className="sb-label">Configuración</span>
        {!collapsed && (
          <span style={{ marginLeft: 'auto', fontSize: 10 }}>
            {configOpen ? '▾' : '▸'}
          </span>
        )}
      </button>

      {configOpen && CONFIG_SUB.map(s => (
        <button
          key={s.k}
          className={`sb-sub ${screen === s.k ? 'active' : ''}`}
          onClick={() => handleNav(s.k)}
        >
          <span style={{ fontSize: 13, flexShrink: 0 }}>{s.icon}</span>
          <span className="sb-label">{s.label}</span>
        </button>
      ))}

      {/* Usuario */}
      {!collapsed && (
        <div className="sb-user">
        <div className="av" style={{
        width: 26, height: 26, fontSize: 10,
        background: 'linear-gradient(135deg, var(--gold), #E8C860)',
        color: '#0B0F17'
        }}>PF</div>
        <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt)' }}>Paulina F.</div>
      <div style={{ fontSize: 8, color: 'var(--txt-mid)' }}>Receptora</div>
    </div>
  </div>
)}
    </aside>
  );
}