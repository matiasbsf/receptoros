import React, { useState } from 'react';

const MODELOS_MOCK = [
  {
    id: 1, tipo: 'Notificación Personal', resultado: 'Positiva', motivo: null,
    vars: ['NOMBRE_DEMANDADO', 'RUT_DEMANDADO', 'DOMICILIO', 'COMUNA', 'FECHA_LETRAS', 'HORA_LETRAS'],
    texto: 'CERTIFICO: Haberme constituido en el domicilio señalado en autos, <strong>[DOMICILIO], [COMUNA]</strong>, a fin de notificar a <strong>[NOMBRE_DEMANDADO]</strong>, RUT <strong>[RUT_DEMANDADO]</strong>, la demanda deducida en su contra. Se notificó personalmente. Doy fe.',
    mejoras: [{ original: 'Se notificó personalmente', sugerido: 'Procedió a entablar contacto directo y personal con el notificado', aceptada: null }]
  },
  {
    id: 2, tipo: 'Notificación Personal', resultado: 'Negativa', motivo: 'No vive ahí',
    vars: ['NOMBRE_DEMANDADO', 'DOMICILIO', 'COMUNA', 'NOMBRE_INFORMANTE'],
    texto: 'CERTIFICO: Haberme constituido en el domicilio señalado en autos, <strong>[DOMICILIO], [COMUNA]</strong>, a fin de notificar a <strong>[NOMBRE_DEMANDADO]</strong>. No pude cumplir la diligencia por cuanto <strong>[NOMBRE_INFORMANTE]</strong> informó que el demandado no vive ahí. Doy fe.',
    mejoras: [{ original: 'no vive ahí', sugerido: 'no tiene domicilio ni residencia en el inmueble referido', aceptada: null }]
  },
  {
    id: 3, tipo: 'Notificación Personal', resultado: 'Negativa', motivo: 'Falleció',
    vars: ['NOMBRE_DEMANDADO', 'DOMICILIO', 'NOMBRE_INFORMANTE', 'FECHA_FALLECIMIENTO'],
    texto: 'CERTIFICO: Haberme constituido en el domicilio señalado en autos, <strong>[DOMICILIO]</strong>. <strong>[NOMBRE_INFORMANTE]</strong> informó que <strong>[NOMBRE_DEMANDADO]</strong> falleció con fecha <strong>[FECHA_FALLECIMIENTO]</strong>. Doy fe.',
    mejoras: []
  },
  {
    id: 4, tipo: 'Notificación Personal', resultado: 'Negativa', motivo: 'Se cambió de domicilio',
    vars: ['NOMBRE_DEMANDADO', 'DOMICILIO', 'NUEVO_DOMICILIO', 'NOMBRE_INFORMANTE'],
    texto: 'CERTIFICO: Haberme constituido en el domicilio señalado en autos, <strong>[DOMICILIO]</strong>. <strong>[NOMBRE_INFORMANTE]</strong> informó que <strong>[NOMBRE_DEMANDADO]</strong> tiene su actual domicilio en <strong>[NUEVO_DOMICILIO]</strong>. Doy fe.',
    mejoras: [{ original: 'tiene su actual domicilio en', sugerido: 'tiene su actual domicilio y residencia en', aceptada: null }]
  },
  {
    id: 5, tipo: 'Notificación Personal', resultado: 'Negativa', motivo: 'No es conocido',
    vars: ['NOMBRE_DEMANDADO', 'DOMICILIO', 'COMUNA'],
    texto: 'CERTIFICO: Haberme constituido en el domicilio señalado en autos, <strong>[DOMICILIO], [COMUNA]</strong>. Vecinos y personas del sector manifestaron no conocer a persona alguna con el nombre de <strong>[NOMBRE_DEMANDADO]</strong>. Doy fe.',
    mejoras: []
  },
  {
    id: 6, tipo: 'Requerimiento de Pago', resultado: 'Positivo', motivo: null,
    vars: ['NOMBRE_DEMANDADO', 'RUT_DEMANDADO', 'DOMICILIO', 'MONTO_LETRAS'],
    texto: 'CERTIFICO: Haberme constituido en el domicilio señalado en autos, <strong>[DOMICILIO]</strong>, a fin de requerir de pago a <strong>[NOMBRE_DEMANDADO]</strong>, RUT <strong>[RUT_DEMANDADO]</strong>, por la suma de <strong>[MONTO_LETRAS]</strong>. Notificado personalmente el requerimiento de pago. Doy fe.',
    mejoras: []
  },
  {
    id: 7, tipo: 'Embargo', resultado: 'Positivo', motivo: null,
    vars: ['NOMBRE_DEMANDADO', 'DOMICILIO', 'BIENES'],
    texto: 'CERTIFICO: Haberme constituido en el domicilio señalado en autos, <strong>[DOMICILIO]</strong>, a fin de practicar embargo de bienes a <strong>[NOMBRE_DEMANDADO]</strong>. Se procedió al embargo de <strong>[BIENES]</strong>. Doy fe.',
    mejoras: []
  },
];

function RichEditor({ value, onChange }) {
  const exec = (cmd) => { document.execCommand(cmd, false, null); };
  const toUpper = () => {
    const sel = window.getSelection();
    if (sel && sel.toString()) {
      document.execCommand('insertText', false, sel.toString().toUpperCase());
    }
  };

  return (
    <div style={{ border: '1px solid var(--bdr)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', gap: 4, padding: '6px 10px',
        borderBottom: '1px solid var(--bdr)',
        background: 'var(--s1)', flexWrap: 'wrap'
      }}>
        {[
          { l: 'B', cmd: 'bold',      s: { fontWeight: 700 } },
          { l: 'I', cmd: 'italic',    s: { fontStyle: 'italic' } },
          { l: 'U', cmd: 'underline', s: { textDecoration: 'underline' } },
        ].map(t => (
          <button
            key={t.cmd}
            onMouseDown={e => { e.preventDefault(); exec(t.cmd); }}
            style={{
              width: 26, height: 26, borderRadius: 5,
              border: '1px solid var(--bdr)',
              background: 'var(--s2)', color: 'var(--txt)',
              cursor: 'pointer', fontSize: 12, ...t.s
            }}
          >{t.l}</button>
        ))}
        <button
          onMouseDown={e => { e.preventDefault(); toUpper(); }}
          style={{
            padding: '0 8px', height: 26, borderRadius: 5,
            border: '1px solid var(--bdr)',
            background: 'var(--s2)', color: 'var(--txt)',
            cursor: 'pointer', fontSize: 10, fontWeight: 700
          }}
        >AA</button>
        <div style={{ width: 1, height: 20, background: 'var(--bdr)', margin: '3px 2px' }} />
        <button
          onMouseDown={e => { e.preventDefault(); exec('justifyFull'); }}
          style={{
            padding: '0 8px', height: 26, borderRadius: 5,
            border: '1px solid var(--bdr)',
            background: 'var(--s2)', color: 'var(--txt-mid)',
            cursor: 'pointer', fontSize: 10
          }}
        >≡ Just</button>
        <button
          onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }}
          style={{
            padding: '0 8px', height: 26, borderRadius: 5,
            border: '1px solid var(--bdr)',
            background: 'var(--s2)', color: 'var(--txt-mid)',
            cursor: 'pointer', fontSize: 10
          }}
        >≡ Izq</button>
      </div>
      <div
        contentEditable
        suppressContentEditableWarning
        onInput={e => onChange && onChange(e.currentTarget.innerHTML)}
        style={{
          padding: '14px 18px', minHeight: 130,
          color: 'var(--txt)', fontSize: 13,
          lineHeight: 1.85, outline: 'none',
          fontFamily: "'Georgia', serif",
          background: 'var(--s2)'
        }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}

function renderTexto(texto) {
  const parts = texto.split(/(\[[A-Z_]+\])/g);
  return parts.map((p, i) =>
    p.match(/^\[[A-Z_]+\]$/) ? (
      <span key={i} style={{
        background: 'var(--blue-bg)', color: 'var(--blue)',
        borderRadius: 4, padding: '0 4px', fontSize: 12,
        fontFamily: "'DM Mono', monospace",
        border: '1px solid rgba(96,165,250,.3)'
      }}>{p}</span>
    ) : (
      <span key={i} dangerouslySetInnerHTML={{ __html: p }} />
    )
  );
}

export default function Modelos() {
  const [modelos, setModelos] = useState(MODELOS_MOCK);
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState('todos');
  const [body, setBody] = useState('');
  const [imp, setImp] = useState(false);
  const [imported, setImported] = useState(false);

  const tipos = [...new Set(modelos.map(m => m.tipo))];
  const filtrados = tab === 'todos' ? modelos : modelos.filter(m => m.tipo === tab);

  const selModel = modelos.find(m => m.id === sel);

  const simImport = () => {
    setImp(true);
    setTimeout(() => { setImp(false); setImported(true); }, 2000);
  };

  const aceptarMejora = (modeloId, idx) => {
    setModelos(prev => prev.map(m => {
      if (m.id !== modeloId) return m;
      const mejoras = m.mejoras.map((mj, i) =>
        i === idx ? { ...mj, aceptada: true } : mj
      );
      const texto = idx < m.mejoras.length
        ? m.texto.replace(m.mejoras[idx].original, m.mejoras[idx].sugerido)
        : m.texto;
      return { ...m, mejoras, texto };
    }));
    if (sel) setBody(modelos.find(m => m.id === sel)?.texto || '');
  };

  const rechazarMejora = (modeloId, idx) => {
    setModelos(prev => prev.map(m => {
      if (m.id !== modeloId) return m;
      const mejoras = m.mejoras.map((mj, i) =>
        i === idx ? { ...mj, aceptada: false } : mj
      );
      return { ...m, mejoras };
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>
            Biblioteca de Modelos
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginTop: 2 }}>
            {modelos.length} modelos · Importa tus documentos Word
          </div>
        </div>
        <button
          className="btn btn-sm"
          style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-lo)', color: 'var(--gold)' }}
          onClick={simImport}
          disabled={imp}
        >
          {imp ? <><span className="spin">⚙</span> Procesando...</> : '📄 Importar Word'}
        </button>
      </div>

      {/* Alerta importación */}
      {imported && (
        <div className="alert alert-green" style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 18 }}>✓</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>
              Documento importado — La IA detectó variables y propone mejoras jurídicas
            </div>
            <div style={{
              background: 'var(--s2)', borderRadius: 8,
              padding: 12, border: '1px solid var(--bdr)'
            }}>
              <div style={{ fontSize: 9, color: 'var(--gold)', fontWeight: 700, letterSpacing: .8, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>
                MEJORA SUGERIDA POR IA
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 4 }}>
                Actual: <span style={{ textDecoration: 'line-through', color: 'var(--red)' }}>"no vive ahí"</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 8 }}>
                → <strong>"no tiene domicilio ni residencia en el inmueble referido"</strong>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn-green btn-sm" onClick={() => setImported(false)}>✓ Aceptar</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setImported(false)}>Mantener original</button>
              </div>
            </div>
          </div>
          <button onClick={() => setImported(false)} style={{ background: 'none', border: 'none', color: 'var(--txt-mid)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
      )}

      {/* Filtros por tipo */}
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
        {['todos', ...tipos].map(t => (
          <button
            key={t}
            className="btn btn-ghost btn-sm"
            style={tab === t ? { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gold-bg)' } : {}}
            onClick={() => setTab(t)}
          >
            {t === 'todos' ? 'Todos' : t}
          </button>
        ))}
      </div>

      {/* Grid modelos + detalle */}
      <div style={{ display: 'grid', gridTemplateColumns: sel ? '280px 1fr' : 'repeat(2, 1fr)', gap: 14 }}>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtrados.map(m => {
            const pendientes = m.mejoras.filter(mj => mj.aceptada === null).length;
            return (
              <div
                key={m.id}
                className="card"
                style={{
                  padding: 14, cursor: 'pointer',
                  borderColor: sel === m.id ? 'var(--gold)' : 'var(--bdr)',
                  borderLeft: `3px solid ${m.resultado === 'Positiva' || m.resultado === 'Positivo' ? 'var(--green)' : 'var(--red)'}`
                }}
                onClick={() => { setSel(sel === m.id ? null : m.id); setBody(m.texto); }}
              >
                <div className="row" style={{ gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt)' }}>{m.tipo}</span>
                  <span style={{
                    padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                    color: m.resultado === 'Positiva' || m.resultado === 'Positivo' ? 'var(--green)' : 'var(--red)',
                    background: m.resultado === 'Positiva' || m.resultado === 'Positivo' ? 'var(--green-bg)' : 'var(--red-bg)'
                  }}>
                    {m.resultado}
                  </span>
                </div>
                {m.motivo && (
                  <div style={{ fontSize: 10, color: 'var(--txt-mid)', marginBottom: 5 }}>→ {m.motivo}</div>
                )}
                <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                  {m.vars.slice(0, 3).map(v => (
                    <span key={v} style={{
                      fontSize: 8, color: 'var(--blue)', background: 'var(--blue-bg)',
                      padding: '1px 5px', borderRadius: 3,
                      fontFamily: "'DM Mono', monospace"
                    }}>{v}</span>
                  ))}
                  {m.vars.length > 3 && (
                    <span style={{ fontSize: 8, color: 'var(--txt-lo)' }}>+{m.vars.length - 3}</span>
                  )}
                </div>
                {pendientes > 0 && (
                  <div style={{ marginTop: 5, fontSize: 9, color: 'var(--amber)' }}>
                    ⚡ {pendientes} mejora(s) IA pendiente(s)
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detalle */}
        {sel && selModel && (
          <div className="card card-p">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)', marginBottom: 5 }}>{selModel.tipo}</div>
                <div className="row" style={{ gap: 6 }}>
                  <span style={{
                    padding: '2px 9px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                    color: selModel.resultado === 'Positiva' || selModel.resultado === 'Positivo' ? 'var(--green)' : 'var(--red)',
                    background: selModel.resultado === 'Positiva' || selModel.resultado === 'Positivo' ? 'var(--green-bg)' : 'var(--red-bg)'
                  }}>
                    {selModel.resultado}
                  </span>
                  {selModel.motivo && (
                    <span style={{ fontSize: 12, color: 'var(--txt-mid)' }}>→ {selModel.motivo}</span>
                  )}
                </div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-sm" style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-lo)', color: 'var(--gold)' }}>
                  ✏ Editar
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setSel(null)}>✕</button>
              </div>
            </div>

            {/* Variables */}
            <div className="sl">Variables del modelo</div>
            <div className="row" style={{ gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
              {selModel.vars.map(v => (
                <span key={v} style={{
                  fontSize: 10, color: 'var(--blue)', background: 'var(--blue-bg)',
                  padding: '2px 8px', borderRadius: 4,
                  fontFamily: "'DM Mono', monospace",
                  border: '1px solid rgba(96,165,250,.3)'
                }}>[{v}]</span>
              ))}
            </div>

            {/* Editor con estilos */}
            <div className="sl">Texto del modelo</div>
            <RichEditor value={body} onChange={setBody} />

            {/* Mejoras IA pendientes */}
            {selModel.mejoras.filter(mj => mj.aceptada === null).length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="sl">⚡ Mejoras sugeridas por IA</div>
                {selModel.mejoras
                  .map((mj, idx) => ({ ...mj, idx }))
                  .filter(mj => mj.aceptada === null)
                  .map(mj => (
                    <div key={mj.idx} style={{
                      background: 'var(--s2)', borderRadius: 10,
                      padding: 14, border: '1px solid rgba(251,191,36,.3)',
                      marginBottom: 10
                    }}>
                      <div style={{ fontSize: 10, color: 'var(--txt-mid)', marginBottom: 4 }}>
                        Actual: <span style={{ textDecoration: 'line-through', color: 'var(--red)' }}>
                          "{mj.original}"
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>
                        → <strong>"{mj.sugerido}"</strong>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--txt-mid)', marginBottom: 10, fontStyle: 'italic' }}>
                        Mayor precisión jurídica para el tribunal.
                      </div>
                      <div className="row" style={{ gap: 8 }}>
                        <button
                          className="btn btn-green btn-sm"
                          onClick={() => aceptarMejora(sel, mj.idx)}
                        >✓ Aceptar</button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => rechazarMejora(sel, mj.idx)}
                        >Mantener original</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

            {selModel.mejoras.filter(mj => mj.aceptada === true).length > 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--green)' }}>
                ✓ {selModel.mejoras.filter(mj => mj.aceptada === true).length} mejora(s) aceptada(s)
              </div>
            )}
          </div>
        )}

        {!sel && (
          <div className="card" style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 32, gap: 8,
            border: '1px dashed var(--bdr)'
          }}>
            <div style={{ fontSize: 36 }}>📋</div>
            <div style={{ fontSize: 13, color: 'var(--txt-mid)' }}>Selecciona un modelo</div>
            <div style={{ fontSize: 11, color: 'var(--txt-lo)', textAlign: 'center', lineHeight: 1.5 }}>
              Las variables en{' '}
              <span style={{ color: 'var(--blue)', fontFamily: "'DM Mono', monospace" }}>[CORCHETES]</span>
              {' '}se reemplazan automáticamente
            </div>
          </div>
        )}
      </div>
    </div>
  );
}