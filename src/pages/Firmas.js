import React, { useState } from 'react';

const ESTAMPES_MOCK = [
  {
    id: 'EST-001', rol: 'C-1234-2025', demandado: 'Juan Pérez López',
    tipo: 'Notificación Personal', estado: 'Error PJUD',
    monto: 85000, distancia: 0,
    body: 'CERTIFICO: Haberme constituido en el domicilio señalado en autos, <strong>AV. PROVIDENCIA Nº 1234, DPTO. 5, PROVIDENCIA</strong>, a fin de notificar a don <strong>JUAN PÉREZ LÓPEZ</strong>, RUT 12.345.678-9. Se notificó personalmente. Doy fe.'
  },
  {
    id: 'EST-002', rol: 'L-0912-2025', demandado: 'Ana Torres Vega',
    tipo: 'Embargo', estado: 'Firmado',
    monto: 180000, distancia: 25000,
    body: 'CERTIFICO: Haberme constituido en el domicilio señalado en autos, <strong>IRARRÁZAVAL Nº 2345, ÑUÑOA</strong>, a fin de practicar embargo de bienes a doña <strong>ANA TORRES VEGA</strong>. Doy fe.'
  },
  {
    id: 'EST-003', rol: 'C-5678-2025', demandado: 'Pedro Soto Muñoz',
    tipo: 'Requerimiento de Pago', estado: 'Revisado',
    monto: 95000, distancia: 0,
    body: 'CERTIFICO: Haberme constituido en el domicilio señalado en autos, <strong>LOS LEONES Nº 567, LAS CONDES</strong>. No fue habido. Doy fe.'
  },
  {
    id: 'EST-004', rol: 'C-3456-2025', demandado: 'Luis Vargas Rojas',
    tipo: 'Notificación Personal', estado: 'Generado',
    monto: 85000, distancia: 0,
    body: 'CERTIFICO: Haberme constituido en el domicilio señalado en autos, <strong>TEATINOS Nº 120, PISO 3, SANTIAGO</strong>. Se notificó personalmente. Doy fe.'
  },
  {
    id: 'EST-005', rol: 'C-7890-2025', demandado: 'Carmen Flores',
    tipo: 'Notificación por Cédula', estado: 'Subido PJUD',
    monto: 65000, distancia: 0,
    body: 'CERTIFICO: Haberme constituido en el domicilio señalado en autos. Se dejó cédula con persona adulta del domicilio. Doy fe.'
  },
];

const MODELOS_DISPONIBLES = [
  { label: 'Notificación Personal — Positiva' },
  { label: 'Notificación Personal — Negativa — No vive ahí' },
  { label: 'Notificación Personal — Negativa — Falleció' },
  { label: 'Notificación Personal — Negativa — Se cambió' },
  { label: 'Notificación por Cédula — Positiva' },
  { label: 'Requerimiento de Pago — Positivo' },
  { label: 'Embargo — Positivo' },
];

const STEPS = ['Generado', 'Revisado', 'Firmado', 'Subido PJUD'];
const STEP_COLORS = ['var(--txt-mid)', 'var(--amber)', 'var(--blue)', 'var(--green)'];

function estadoColor(e) {
  const map = {
    'Generado':    { c: 'var(--txt-mid)', bg: 'var(--s2)' },
    'Revisado':    { c: 'var(--amber)',   bg: 'var(--amber-bg)' },
    'Firmado':     { c: 'var(--blue)',    bg: 'var(--blue-bg)' },
    'Subido PJUD': { c: 'var(--green)',   bg: 'var(--green-bg)' },
    'Error PJUD':  { c: 'var(--red)',     bg: 'var(--red-bg)' },
  };
  return map[e] || map['Generado'];
}

function Semaforo({ estado }) {
  const idx = STEPS.indexOf(estado);
  const isErr = estado === 'Error PJUD';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {STEPS.map((s, i) => {
        const done = idx > i;
        const cur = idx === i || (isErr && i === 2);
        const err = isErr && i === 3;
        const col = err ? 'var(--red)' : (done || cur) ? STEP_COLORS[i] : 'var(--txt-lo)';
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2
            }}>
              <div style={{
                width: 9, height: 9, borderRadius: '50%',
                background: (done || cur || err) ? col : 'var(--s3, #243044)',
                border: `2px solid ${(done || cur || err) ? col : 'var(--bdr)'}`,
                transition: 'all .3s'
              }} />
              <span style={{
                fontSize: 7, color: col,
                fontFamily: "'DM Mono', monospace",
                whiteSpace: 'nowrap'
              }}>
                {err && i === 3 ? 'Error' : s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: 16, height: 1,
                background: done ? col : 'var(--bdr)',
                marginBottom: 14, transition: 'all .3s'
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RichEditor({ value, onChange }) {
  const exec = (cmd) => {
    document.execCommand(cmd, false, null);
  };
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
          { l: 'B', cmd: 'bold', style: { fontWeight: 700 } },
          { l: 'I', cmd: 'italic', style: { fontStyle: 'italic' } },
          { l: 'U', cmd: 'underline', style: { textDecoration: 'underline' } },
        ].map(t => (
          <button
            key={t.cmd}
            onMouseDown={e => { e.preventDefault(); exec(t.cmd); }}
            style={{
              width: 26, height: 26, borderRadius: 5,
              border: '1px solid var(--bdr)',
              background: 'var(--s2)', color: 'var(--txt)',
              cursor: 'pointer', fontSize: 12, ...t.style
            }}
          >{t.l}</button>
        ))}
        <button
          onMouseDown={e => { e.preventDefault(); toUpper(); }}
          style={{
            padding: '0 8px', height: 26, borderRadius: 5,
            border: '1px solid var(--bdr)',
            background: 'var(--s2)', color: 'var(--txt)',
            cursor: 'pointer', fontSize: 10, fontWeight: 700, letterSpacing: .5
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
        onInput={e => onChange(e.currentTarget.innerHTML)}
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

function EstampePreview({ body, monto, distancia }) {
  return (
    <div style={{
      background: '#fff', color: '#111',
      borderRadius: 8, padding: '20px 28px',
      fontFamily: "'Times New Roman', serif",
      fontSize: 12.5, lineHeight: 1.8,
      border: '1px solid var(--bdr)'
    }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 1 }}>Paulina Fuentes Hevia</div>
      <div style={{ fontSize: 11.5, color: '#555', marginBottom: 10 }}>Receptora Judicial</div>
      <div style={{ marginBottom: 12 }}>
        <div><b style={{ minWidth: 100, display: 'inline-block' }}>TRIBUNAL</b> : <b>Juzgado de Letras y Garantía de Quintero</b></div>
        <div><b style={{ minWidth: 100, display: 'inline-block' }}>ROL</b> : <b>C-1234-2025</b></div>
        <div><b style={{ minWidth: 100, display: 'inline-block' }}>CARATULADO</b> : <b>BANCO / PÉREZ</b></div>
      </div>
      <div
        style={{ textAlign: 'justify', marginBottom: 14 }}
        dangerouslySetInnerHTML={{ __html: body }}
      />
      <div style={{ fontSize: 11, marginBottom: 10 }}>
        <span style={{ fontWeight: 700 }}>Drs. ${monto.toLocaleString('es-CL')}.-</span>
        {distancia > 0 && (
          <>
            <span style={{ margin: '0 12px', color: '#777' }}>
              Distancia: <b>${distancia.toLocaleString('es-CL')}.-</b>
            </span>
            <span>Total: <b>${(monto + distancia).toLocaleString('es-CL')}.-</b></span>
          </>
        )}
        <span> (s/imp.)</span>
      </div>
      <div style={{
        borderTop: '1px solid #ccc', paddingTop: 10, marginTop: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'
      }}>
        <div style={{ fontSize: 11, color: '#555' }}>
          <div>pfhevia@gmail.com</div>
          <div>+56 9 6312 5974</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#555' }}>
          <div>Firmado digitalmente por</div>
          <div style={{ fontWeight: 700 }}>Paulina Victoria Fuentes Hevia</div>
          <div>Fecha: {new Date().toLocaleDateString('es-CL')}</div>
          <div>Firmado mediante ReceptorOS</div>
        </div>
      </div>
    </div>
  );
}

export default function Firmas() {
  const [estampes, setEstampes] = useState(ESTAMPES_MOCK);
  const [sel, setSel] = useState(null);
  const [body, setBody] = useState('');
  const [monto, setMonto] = useState(0);
  const [distancia, setDistancia] = useState(0);
  const [preview, setPreview] = useState(false);
  const [showModelos, setShowModelos] = useState(false);
  const [filtro, setFiltro] = useState('Todos');

  const conteos = {
    'Generado':    estampes.filter(e => e.estado === 'Generado').length,
    'Revisado':    estampes.filter(e => e.estado === 'Revisado').length,
    'Firmado':     estampes.filter(e => e.estado === 'Firmado').length,
    'Subido PJUD': estampes.filter(e => e.estado === 'Subido PJUD').length,
    'Error PJUD':  estampes.filter(e => e.estado === 'Error PJUD').length,
  };

  const filtrados = filtro === 'Todos'
    ? estampes
    : estampes.filter(e => e.estado === filtro);

  const abrirEstampe = (e) => {
    setSel(e);
    setBody(e.body);
    setMonto(e.monto);
    setDistancia(e.distancia || 0);
    setPreview(false);
    setShowModelos(false);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>
          Centro de Firmas
        </div>
        <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginTop: 2 }}>
          {estampes.length} estampes · {conteos['Error PJUD']} con error PJUD · {conteos['Firmado']} listos para subir
        </div>
      </div>

      {/* Contadores semáforo */}
      <div className="g4" style={{ marginBottom: 16, gridTemplateColumns: 'repeat(5,1fr)' }}>
        {[
          { l: 'Generado',    i: '⚪', c: 'var(--txt-mid)' },
          { l: 'Revisado',    i: '🟡', c: 'var(--amber)'   },
          { l: 'Firmado',     i: '🔵', c: 'var(--blue)'    },
          { l: 'Subido PJUD', i: '🟢', c: 'var(--green)'   },
          { l: 'Error PJUD',  i: '🔴', c: 'var(--red)'     },
        ].map(s => (
          <div
            key={s.l}
            className="statcard"
            style={{
              textAlign: 'center', cursor: 'pointer', padding: '12px 8px',
              borderColor: filtro === s.l ? s.c : 'var(--bdr)',
              background: filtro === s.l ? s.c + '15' : 'var(--s1)'
            }}
            onClick={() => setFiltro(filtro === s.l ? 'Todos' : s.l)}
          >
            <div style={{ fontSize: 18, marginBottom: 3 }}>{s.i}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.c, fontFamily: "'Cormorant Garamond', serif" }}>
              {conteos[s.l] || 0}
            </div>
            <div style={{ fontSize: 8, color: s.c, fontWeight: 700, letterSpacing: .7, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', marginTop: 3 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* Layout lista + panel */}
      <div style={{ display: 'grid', gridTemplateColumns: sel ? '320px 1fr' : '1fr', gap: 16 }}>

        {/* Lista estampes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtrados.map(e => {
            const { c } = estadoColor(e.estado);
            return (
              <div
                key={e.id}
                className="card"
                style={{
                  padding: 14, cursor: 'pointer',
                  borderColor: sel?.id === e.id ? 'var(--gold)' : e.estado === 'Error PJUD' ? 'var(--red)' : 'var(--bdr)'
                }}
                onClick={() => abrirEstampe(e)}
              >
                {e.estado === 'Error PJUD' && (
                  <div style={{
                    background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,.3)',
                    borderRadius: 6, padding: '4px 9px', marginBottom: 7,
                    display: 'flex', gap: 5, alignItems: 'center'
                  }}>
                    <span>🔴</span>
                    <span style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700 }}>
                      Firmado — falta subir al PJUD
                    </span>
                  </div>
                )}
                <div className="row" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="row" style={{ marginBottom: 3, flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', fontFamily: "'DM Mono', monospace" }}>
                        {e.rol}
                      </span>
                      <span className="badge" style={{ color: c, background: c + '18', border: `1px solid ${c}33` }}>
                        <span className="bdot" style={{ background: c }} />
                        {e.estado}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt)', marginBottom: 2 }}>{e.demandado}</div>
                    <div style={{ fontSize: 10, color: 'var(--txt-mid)', marginBottom: 8 }}>{e.tipo}</div>
                    <Semaforo estado={e.estado} />
                  </div>
                  <div className="av" style={{
                    width: 24, height: 24, fontSize: 9,
                    background: 'linear-gradient(135deg, var(--gold), #E8C860)',
                    color: '#0B0F17'
                  }}>PF</div>
                </div>
              </div>
            );
          })}

          {filtrados.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--txt-mid)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✍</div>
              <div>No hay estampes en este estado</div>
            </div>
          )}
        </div>

        {/* Panel edición */}
        {sel && (
          <div className="card card-p">
            {/* Header panel */}
            <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>{sel.tipo}</div>
                <div className="row" style={{ marginTop: 4, gap: 6 }}>
                  <span className="tag" style={{ color: 'var(--gold)', background: 'var(--gold-bg)', border: '1px solid var(--gold-lo)' }}>
                    {sel.rol}
                  </span>
                  <span className="badge" style={{
                    color: estadoColor(sel.estado).c,
                    background: estadoColor(sel.estado).c + '18',
                    border: `1px solid ${estadoColor(sel.estado).c}33`
                  }}>
                    <span className="bdot" style={{ background: estadoColor(sel.estado).c }} />
                    {sel.estado}
                  </span>
                </div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPreview(!preview)}
                >
                  {preview ? '✏ Editor' : '👁 Vista previa'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSel(null)}
                >✕</button>
              </div>
            </div>

            {/* Cambiar modelo */}
            <div style={{
              background: 'var(--s2)', borderRadius: 9,
              padding: '9px 12px', marginBottom: 12,
              border: '1px solid var(--bdr)'
            }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt)' }}>
                  Modelo: <span style={{ color: 'var(--gold)' }}>{sel.tipo}</span>
                </div>
                <button
                  className="btn btn-amber btn-sm"
                  onClick={() => setShowModelos(!showModelos)}
                >
                  ↺ Cambiar modelo
                </button>
              </div>
              {showModelos && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: 'var(--txt-mid)', marginBottom: 6 }}>
                    Selecciona el modelo correcto:
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {MODELOS_DISPONIBLES.map(m => (
                      <button
                        key={m.label}
                        className="btn btn-ghost btn-sm"
                        onClick={() => setShowModelos(false)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Precio editable */}
            <div style={{
              background: 'var(--s2)', borderRadius: 9,
              padding: '9px 12px', marginBottom: 12,
              border: '1px solid var(--bdr)'
            }}>
              <div className="sl">Precio (editable)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--txt-lo)', marginBottom: 3 }}>ARANCEL</div>
                  <input
                    type="number"
                    value={monto}
                    onChange={e => setMonto(Number(e.target.value))}
                    style={{ color: 'var(--green)', fontWeight: 700, textAlign: 'right' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--txt-lo)', marginBottom: 3 }}>DISTANCIA</div>
                  <input
                    type="number"
                    value={distancia}
                    onChange={e => setDistancia(Number(e.target.value))}
                    style={{ color: 'var(--amber)', fontWeight: 700, textAlign: 'right' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: 'var(--txt-lo)', marginBottom: 3 }}>TOTAL (s/imp.)</div>
                  <div style={{
                    background: 'var(--s0)', border: '1px solid var(--bdr)',
                    borderRadius: 8, padding: '8px 11px',
                    fontSize: 12, fontWeight: 800, textAlign: 'right',
                    color: 'var(--txt)'
                  }}>
                    ${(monto + distancia).toLocaleString('es-CL')}
                  </div>
                </div>
              </div>
            </div>

            {/* Editor o Preview */}
            {!preview ? (
              <>
                <div className="sl">✏ Editar antes de firmar</div>
                <RichEditor value={body} onChange={setBody} />
              </>
            ) : (
              <>
                <div className="sl">👁 Vista previa — formato final</div>
                <EstampePreview body={body} monto={monto} distancia={distancia} />
              </>
            )}

            {/* Acciones según estado */}
            <div className="row" style={{ marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
              {sel.estado === 'Generado' && (
                <button className="btn btn-amber" style={{ padding: '8px 18px' }}>
                  ✓ Marcar como revisado
                </button>
              )}
              {sel.estado === 'Revisado' && (
                <button className="btn" style={{ background: 'var(--blue)', color: '#fff', padding: '8px 18px' }}>
                  ✍ Firmar con Token E-Certchile
                </button>
              )}
              {(sel.estado === 'Firmado' || sel.estado === 'Error PJUD') && (
                <>
                  <button className="btn" style={{
                    background: sel.estado === 'Error PJUD' ? 'var(--red)' : 'var(--green)',
                    color: '#fff', padding: '8px 18px'
                  }}>
                    ↑ {sel.estado === 'Error PJUD' ? 'Reintentar subida al PJUD' : 'Subir al PJUD'}
                  </button>
                  {sel.estado === 'Error PJUD' && (
                    <button className="btn btn-amber">⚠ Marcar con observación</button>
                  )}
                </>
              )}
              {sel.estado === 'Subido PJUD' && (
                <div style={{
                  padding: '8px 14px', background: 'var(--green-bg)',
                  border: '1px solid rgba(52,211,153,.3)',
                  borderRadius: 8, fontSize: 12,
                  color: 'var(--green)', fontWeight: 700
                }}>
                  ✓ Subido correctamente al PJUD
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}