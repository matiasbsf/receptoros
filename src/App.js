import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Causas from './pages/Causas';
import Firmas from './pages/Firmas';
import Rutas from './pages/Rutas';
import Cobranza from './pages/Cobranza';
import Clientes from './pages/Clientes';
import Modelos from './pages/Modelos';
import Equipo from './pages/Equipo';
import Configuracion from './pages/Configuracion';

const INACTIVIDAD_MS = 30 * 60 * 1000; // 30 minutos

function AppContent() {
  const [user, setUser]     = useState(null);
  const [screen, setScreen] = useState('causas');
  const [showWarning, setShowWarning] = useState(false);

  // ── Cerrar sesión ──────────────────────────────────────────────
  const handleLogout = useCallback((porInactividad = false) => {
    localStorage.removeItem('receptoros_user');
    localStorage.removeItem('receptoros_last_activity');
    setUser(null);
    setScreen('causas');
    setShowWarning(false);
    if (porInactividad) {
      alert('Sesión cerrada por inactividad (30 minutos).');
    }
  }, []);

  // ── Registrar actividad ────────────────────────────────────────
  const registrarActividad = useCallback(() => {
    localStorage.setItem('receptoros_last_activity', Date.now().toString());
    setShowWarning(false);
  }, []);

  // ── Cargar sesión guardada ─────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('receptoros_user');
    const lastActivity = localStorage.getItem('receptoros_last_activity');
    if (saved) {
      try {
        const tiempoInactivo = Date.now() - parseInt(lastActivity || '0');
        if (tiempoInactivo > INACTIVIDAD_MS) {
          localStorage.removeItem('receptoros_user');
          localStorage.removeItem('receptoros_last_activity');
        } else {
          setUser(JSON.parse(saved));
          registrarActividad();
        }
      } catch {
        localStorage.removeItem('receptoros_user');
      }
    }
  }, [registrarActividad]);

  // ── Detectar actividad del usuario ─────────────────────────────
  useEffect(() => {
    if (!user) return;

    const eventos = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    eventos.forEach(e => window.addEventListener(e, registrarActividad));

    // Revisar inactividad cada minuto
    const intervalo = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('receptoros_last_activity') || '0');
      const tiempoInactivo = Date.now() - lastActivity;

      // Advertencia a los 25 minutos
      if (tiempoInactivo > 25 * 60 * 1000 && tiempoInactivo < INACTIVIDAD_MS) {
        setShowWarning(true);
      }

      // Cerrar a los 30 minutos
      if (tiempoInactivo >= INACTIVIDAD_MS) {
        handleLogout(true);
      }
    }, 60 * 1000);

    return () => {
      eventos.forEach(e => window.removeEventListener(e, registrarActividad));
      clearInterval(intervalo);
    };
  }, [user, registrarActividad, handleLogout]);

  const handleLogin = (userData) => {
    setUser(userData);
    registrarActividad();
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const renderScreen = () => {
    switch(screen) {
      case 'causas':   return <Causas />;
      case 'firmas':   return <Firmas />;
      case 'rutas':    return <Rutas />;
      case 'cobranza': return <Cobranza />;
      case 'clientes': return <Clientes />;
      case 'modelos':  return <Modelos />;
      case 'equipo':   return <Equipo />;
      case 'ajustes':  return <Configuracion />;
      default: return (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--txt-mid)' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🚧</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>
            Módulo en construcción
          </div>
          <div style={{ fontSize: 13 }}>Próximamente disponible</div>
        </div>
      );
    }
  };

  return (
    <div>
      {/* Advertencia inactividad */}
      {showWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
          background: 'var(--amber)', padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0B0F17' }}>
            ⚠ Tu sesión se cerrará en 5 minutos por inactividad
          </span>
          <button
            onClick={registrarActividad}
            style={{
              background: '#0B0F17', border: 'none', borderRadius: 7,
              padding: '5px 14px', color: 'var(--amber)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer'
            }}
          >
            Seguir conectado
          </button>
        </div>
      )}

      <Header user={user} onLogout={() => handleLogout(false)} />
      <div className="app-layout">
        <Sidebar screen={screen} setScreen={setScreen} />
        <main className="main-content" style={{ marginTop: showWarning ? 40 : 0 }}>
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}