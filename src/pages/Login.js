import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!usuario || !clave) {
      setError('Ingresa usuario y clave');
      return;
    }
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('equipo')
      .select('*')
      .eq('usuario', usuario.toLowerCase().trim())
      .eq('clave', clave)
      .eq('activo', true)
      .single();

    if (error || !data) {
      setError('Usuario o clave incorrectos');
      setLoading(false);
      return;
    }

    localStorage.setItem('receptoros_user', JSON.stringify(data));
    onLogin(data);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: 380, padding: '0 20px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, var(--gold), #E8C860)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 16px'
          }}>⚖</div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 32, fontWeight: 700,
            color: 'var(--gold)', letterSpacing: -.5
          }}>ReceptorOS</div>
          <div style={{ fontSize: 13, color: 'var(--txt-mid)', marginTop: 4 }}>
            Gestión Judicial Inteligente
          </div>
        </div>

        {/* Card login */}
        <div className="card card-p" style={{ padding: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)', marginBottom: 20 }}>
            Iniciar sesión
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div className="sl" style={{ marginBottom: 6 }}>Usuario</div>
              <input
                placeholder="Tu nombre de usuario"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="username"
                style={{ fontSize: 14 }}
              />
            </div>

            <div>
              <div className="sl" style={{ marginBottom: 6 }}>Clave</div>
              <input
                type="password"
                placeholder="••••••••"
                value={clave}
                onChange={e => setClave(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
                style={{ fontSize: 14 }}
              />
            </div>

            {error && (
              <div style={{
                background: 'var(--red-bg)',
                border: '1px solid rgba(248,113,113,.3)',
                borderRadius: 8, padding: '8px 12px',
                fontSize: 12, color: 'var(--red)', fontWeight: 600
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              className="btn btn-gold"
              style={{ width: '100%', padding: '12px', fontSize: 14, marginTop: 4 }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading
                ? <><span className="spin">⚙</span> Verificando...</>
                : 'Ingresar →'
              }
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--txt-lo)' }}>
          ReceptorOS · Quintero, Chile 🇨🇱
        </div>
      </div>
    </div>
  );
}