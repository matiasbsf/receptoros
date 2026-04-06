import React, { useState, useEffect } from 'react';
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

function AppContent() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('causas');

  useEffect(() => {
    const saved = localStorage.getItem('receptoros_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); }
      catch { localStorage.removeItem('receptoros_user'); }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('receptoros_user');
    setUser(null);
    setScreen('causas');
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
      <Header user={user} onLogout={handleLogout} />
      <div className="app-layout">
        <Sidebar screen={screen} setScreen={setScreen} />
        <main className="main-content">
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