import React, { useState } from 'react';
import './App.css';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

function AppContent() {
  const [screen, setScreen] = useState('causas');

  return (
    <div>
      <Header />
      <div className="app-layout">
        <Sidebar screen={screen} setScreen={setScreen} />
        <main className="main-content">
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28, fontWeight: 700,
            color: 'var(--txt)', marginBottom: 8
          }}>
            {screen.charAt(0).toUpperCase() + screen.slice(1)}
          </div>
          <div style={{ color: 'var(--txt-mid)', fontSize: 13 }}>
            Módulo en construcción...
          </div>
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