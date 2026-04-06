import React, { useState } from 'react';
import './App.css';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Causas from './pages/Causas';
import Firmas from './pages/Firmas';

function AppContent() {
  const [screen, setScreen] = useState('causas');

  const renderScreen = () => {
    switch(screen) {
      case 'causas':  return <Causas />;
      case 'firmas':  return <Firmas />;
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
      <Header />
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