import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      {/* Logo */}
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: 'linear-gradient(135deg, var(--gold), #E8C860)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 15, flexShrink: 0
      }}>⚖</div>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* Estados integración */}
        <div style={{
          display: 'flex', gap: 6, alignItems: 'center',
          padding: '3px 8px', borderRadius: 5,
          background: 'var(--amber-bg)',
          border: '1px solid rgba(251,191,36,.2)'
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--amber)' }} />
          <span style={{ fontSize: 9, color: 'var(--amber)', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>PJUD</span>
        </div>

        <div style={{
          display: 'flex', gap: 6, alignItems: 'center',
          padding: '3px 8px', borderRadius: 5,
          background: 'var(--amber-bg)',
          border: '1px solid rgba(251,191,36,.2)'
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--amber)' }} />
          <span style={{ fontSize: 9, color: 'var(--amber)', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>Gmail</span>
        </div>

        <div style={{
          display: 'flex', gap: 6, alignItems: 'center',
          padding: '3px 8px', borderRadius: 5,
          background: 'var(--green-bg)',
          border: '1px solid rgba(52,211,153,.2)'
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: 9, color: 'var(--green)', fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>receptorquintero.cl</span>
        </div>

        {/* Toggle tema */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: 14 }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Avatar */}
        <div className="av" style={{
          width: 28, height: 28, fontSize: 11,
          background: 'linear-gradient(135deg, var(--gold), #E8C860)',
          color: '#0B0F17'
        }}>PF</div>
      </div>
    </header>
  );
}