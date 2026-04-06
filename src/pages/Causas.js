import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { TRIBUNALES_POR_CORTE } from '../data/tribunales';

const ESTADOS = [
  'Pendiente', 'En Proceso', 'Firmado', 'Subido PJUD',
  'Error PJUD', 'Enviado a Cobro', 'Pendiente de Pago', 'Pagado'
];

function Badge({ estado }) {
  const map = {
    'Pendiente':         { color: 'var(--amber)', bg: 'var(--amber-bg)' },
    'En Proceso':        { color: 'var(--blue)',  bg: 'var(--blue-bg)'  },
    'Firmado':           { color: 'var(--blue)',  bg: 'var(--blue-bg)'  },
    'Subido PJUD':       { color: 'var(--green)', bg: 'var(--green-bg)' },
    'Error PJUD':        { color: 'var(--red)',   bg: 'var(--red-bg)'   },
    'Enviado a Cobro':   { color: 'var(--violet)',bg: 'var(--violet-bg)'},
    'Pendiente de Pago': { color: 'var(--amber)', bg: 'var(--amber-bg)' },
    'Pagado':            { color: 'var(--green)', bg: 'var(--green-bg)' },
  };
  const s = map[estado] || map['Pendiente'];
  return (
    <span className="badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.color}33` }}>
      <span className="bdot" style={{ background: s.color }} />
      {estado}
    </span>
  );
}

function NuevaCausa({ onClose, onGuardar }) {
  const [notificados, setNotificados] = useState([
    { nombre: '', rut: '', domicilio: '', comuna: '' }
  ]);
  const [esCBR, setEsCBR]             = useState(false);
  const [pjudBuscado, setPjudBuscado] = useState(false);
  const [buscandoPJUD, setBuscandoPJUD] = useState(false);
  const [guardando, setGuardando]     = useState(false);
  const [corteSeleccionada, setCorteSeleccionada] = useState('');
  const [form, setForm] = useState({
    rol: '', nInterno: '', tribunal: '', tipo: '',
    demandante: '', cliente: '', cartera: '', caratulaCBR: ''
  });

  const setF = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  // Cargar corte y tribunal por defecto desde configuración
  useEffect(() => {
  const cargarDefaults = async () => {
    const { data } = await supabase
      .from('configuracion')
      .select('corte, tribunal')
      .single();
    if (data?.corte) {
      setCorteSeleccionada(data.corte);
      setForm(p => ({ 
        ...p, 
        tribunal: data.tribunal || TRIBUNALES_POR_CORTE[data.corte]?.[0] || ''
      }));
    }
  };
  cargarDefaults();
}, []);

  const simPJUD = () => {
    if (!form.rol) return;
    setBuscandoPJUD(true);
    setTimeout(() => {
      setForm(p => ({
        ...p,
        demandante: 'Banco Santander',
        cliente: 'ASINVERCO',
        cartera: 'Banco Santander',
      }));
      setNotificados([{
        nombre: 'Juan Pérez López',
        rut: '12.345.678-9',
        domicilio: 'Av. Providencia 1234, Dpto 5',
        comuna: 'Providencia'
      }]);
      setPjudBuscado(true);
      setBuscandoPJUD(false);
    }, 1600);
  };

  const addNotificado    = () => setNotificados(p => [...p, { nombre: '', rut: '', domicilio: '', comuna: '' }]);
  const copyPrev         = i  => setNotificados(p => p.map((n, j) => j === i ? { ...n, domicilio: p[i-1].domicilio, comuna: p[i-1].comuna } : n));
  const removeNotificado = i  => setNotificados(p => p.filter((_, j) => j !== i));

  const guardar = async () => {
    if (!form.rol || !form.tribunal) return;
    setGuardando(true);
    try {
      const { error } = await supabase
        .from('causas')
        .insert([{
          rol:          form.rol,
          n_interno:    form.nInterno || null,
          tribunal:     form.tribunal,
          tipo:         form.tipo,
          demandante:   form.demandante,
          demandado:    notificados[0]?.nombre || '',
          rut:          notificados[0]?.rut || '',
          domicilio:    notificados[0]?.domicilio || '',
          comuna:       notificados[0]?.comuna || '',
          estado:       'Pendiente',
          monto:        0,
          distancia:    0,
          pjud:         pjudBuscado,
          cbr:          esCBR,
          caratula_cbr: esCBR ? form.caratulaCBR : null,
        }]);
      if (error) throw error;
      onGuardar && onGuardar();
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error al guardar. Intenta nuevamente.');
    }
    setGuardando(false);
  };

  return (
    <div className="card card-p" style={{ marginBottom: 16 }}>
      <div className="row" style={{ marginBottom: 16, justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)' }}>Nueva Causa</div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Cancelar</button>
      </div>

      {/* PJUD */}
      <div style={{
        background: 'var(--s2)', border: '1px solid rgba(96,165,250,.3)',
        borderRadius: 10, padding: 14, marginBottom: 16
      }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'var(--blue-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13
          }}>🔗</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>
            Autocompletar desde PJUD
          </span>
          {pjudBuscado && (
            <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, marginLeft: 8 }}>
              ✓ Datos obtenidos
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8 }}>
          {/* ROL */}
          <div className="col" style={{ gap: 4 }}>
            <div className="sl" style={{ marginBottom: 4 }}>ROL *</div>
            <input
              placeholder="C-1234-2025"
              value={form.rol}
              onChange={setF('rol')}
            />
          </div>

          {/* Corte */}
          <div className="col" style={{ gap: 4 }}>
            <div className="sl" style={{ marginBottom: 4 }}>Corte</div>
            <select
              value={corteSeleccionada}
              onChange={e => {
                const c = e.target.value;
                setCorteSeleccionada(c);
                const tribunales = TRIBUNALES_POR_CORTE[c] || [];
                setForm(p => ({ ...p, tribunal: tribunales[0] || '' }));
              }}
            >
              {Object.keys(TRIBUNALES_POR_CORTE).map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Tribunal */}
          <div className="col" style={{ gap: 4 }}>
            <div className="sl" style={{ marginBottom: 4 }}>Tribunal *</div>
            <select value={form.tribunal} onChange={setF('tribunal')}>
              {(TRIBUNALES_POR_CORTE[corteSeleccionada] || []).map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Botón buscar */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn btn-blue"
              onClick={simPJUD}
              disabled={buscandoPJUD}
            >
              {buscandoPJUD ? <span className="spin">⚙</span> : '🔍'} Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Datos principales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        {[
          { label: 'N° Interno (si aplica)', key: 'nInterno',   ph: 'Número del cliente' },
          { label: 'Tipo de gestión *',      key: 'tipo',       ph: 'Notificación Personal' },
          { label: 'Demandante',             key: 'demandante', ph: 'Nombre demandante' },
          { label: 'Cliente',                key: 'cliente',    ph: 'ASINVERCO' },
          { label: 'Cartera',                key: 'cartera',    ph: 'Banco Santander' },
        ].map(f => (
          <div key={f.key} className="col" style={{ gap: 4 }}>
            <div className="sl" style={{ marginBottom: 4 }}>{f.label}</div>
            <input
              placeholder={f.ph}
              value={form[f.key]}
              onChange={setF(f.key)}
              style={pjudBuscado && form[f.key]
                ? { borderColor: 'var(--green)', background: 'var(--green-bg)' }
                : {}}
            />
          </div>
        ))}
      </div>

      {/* CBR */}
      <div style={{
        background: 'var(--s2)', borderRadius: 9,
        border: '1px solid var(--bdr)',
        padding: '10px 14px', marginBottom: 14,
        display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap'
      }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
          <div
            onClick={() => setEsCBR(!esCBR)}
            style={{
              width: 18, height: 18, borderRadius: 4,
              border: `2px solid ${esCBR ? 'var(--gold)' : 'var(--bdr)'}`,
              background: esCBR ? 'var(--gold)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all .15s', flexShrink: 0
            }}
          >
            {esCBR && <span style={{ color: '#0B0F17', fontSize: 11, fontWeight: 900 }}>✓</span>}
          </div>
          <span style={{ fontSize: 12, color: 'var(--txt)' }}>
            Es causa de Conservador de Bienes Raíces (CBR)
          </span>
        </label>
        {esCBR && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="sl" style={{ marginBottom: 4 }}>N° Carátula CBR</div>
            <input
              placeholder="CBR-2025-XXXX"
              value={form.caratulaCBR}
              onChange={setF('caratulaCBR')}
            />
          </div>
        )}
      </div>

      {/* Notificados */}
      <div style={{ marginBottom: 14 }}>
        <div className="row" style={{ marginBottom: 10, justifyContent: 'space-between' }}>
          <div className="sl" style={{ marginBottom: 0 }}>Notificados</div>
          <button
            className="btn btn-sm"
            style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-lo)', color: 'var(--gold)' }}
            onClick={addNotificado}
          >
            + Agregar notificado
          </button>
        </div>

        {notificados.map((n, i) => (
          <div key={i} style={{
            background: 'var(--s2)', borderRadius: 10,
            padding: 14, border: '1px solid var(--bdr)', marginBottom: 10
          }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)' }}>
                Notificado {i + 1}{i === 0 ? ' (principal)' : ''}
              </div>
              <div className="row" style={{ gap: 6 }}>
                {i > 0 && (
                  <button className="btn btn-blue btn-sm" onClick={() => copyPrev(i)}>
                    📋 Copiar domicilio anterior
                  </button>
                )}
                {i > 0 && (
                  <button className="btn btn-red btn-sm" onClick={() => removeNotificado(i)}>✕</button>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Nombre *',   key: 'nombre',   ph: 'Nombre completo' },
                { label: 'RUT',        key: 'rut',      ph: 'XX.XXX.XXX-X' },
                { label: 'Domicilio *',key: 'domicilio',ph: 'Calle y número' },
                { label: 'Comuna *',   key: 'comuna',   ph: 'Comuna' },
              ].map(f => (
                <div key={f.key} className="col" style={{ gap: 4 }}>
                  <div className="sl" style={{ marginBottom: 4 }}>{f.label}</div>
                  <input
                    placeholder={f.ph}
                    value={n[f.key]}
                    onChange={e => setNotificados(p =>
                      p.map((x, j) => j === i ? { ...x, [f.key]: e.target.value } : x)
                    )}
                    style={pjudBuscado && n[f.key]
                      ? { borderColor: 'var(--green)', background: 'var(--green-bg)' }
                      : {}}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Acciones */}
      <div className="row">
        <button
          className="btn btn-gold"
          style={{ padding: '10px 24px', fontSize: 13 }}
          onClick={guardar}
          disabled={guardando}
        >
          {guardando
            ? <><span className="spin">⚙</span> Guardando...</>
            : 'Crear Causa'}
        </button>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

export default function Causas() {
  const [causas, setCausas]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroCBR, setFiltroCBR]     = useState(false);
  const [search, setSearch]           = useState('');
  const [showNueva, setShowNueva]     = useState(false);
  const [showAlert, setShowAlert]     = useState(true);

  const cargarCausas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('causas')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setCausas(data || []);
    setLoading(false);
  };

  useEffect(() => { cargarCausas(); }, []);

  const eliminarCausa = async id => {
    if (!window.confirm('¿Eliminar esta causa?')) return;
    await supabase.from('causas').delete().eq('id', id);
    cargarCausas();
  };

  const filtradas = causas.filter(c => {
    if (filtroEstado !== 'Todos' && c.estado !== filtroEstado) return false;
    if (filtroCBR && !c.cbr) return false;
    if (search &&
      !c.rol?.toLowerCase().includes(search.toLowerCase()) &&
      !c.demandado?.toLowerCase().includes(search.toLowerCase()) &&
      !c.demandante?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {/* Alerta sitio web */}
      {showAlert && (
        <div className="alert alert-blue" style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🌐</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', marginBottom: 3 }}>
              Nueva solicitud desde receptorquintero.cl
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginBottom: 8 }}>
              ROL: <strong style={{ color: 'var(--txt)' }}>C-8888-2025</strong> · Juzgado Quintero · Notificación Personal · ASINVERCO
            </div>
            <div className="row">
              <button className="btn btn-green btn-sm">✓ Aceptar e ingresar</button>
              <button className="btn btn-red btn-sm" onClick={() => setShowAlert(false)}>✕ Rechazar</button>
            </div>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            style={{ background: 'none', border: 'none', color: 'var(--txt-mid)', cursor: 'pointer', fontSize: 18 }}
          >×</button>
        </div>
      )}

      {/* Header */}
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", color: 'var(--txt)' }}>
            Causas
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-mid)', marginTop: 2 }}>
            {causas.length} causas · {causas.filter(c => c.estado === 'Pendiente').length} pendientes
          </div>
        </div>
        <button className="btn btn-ghost btn-sm">📊 Importar Excel</button>
        <button className="btn btn-gold" onClick={() => setShowNueva(!showNueva)}>
          {showNueva ? '✕ Cancelar' : '+ Nueva Causa'}
        </button>
      </div>

      {/* Formulario nueva causa */}
      {showNueva && (
        <NuevaCausa
          onClose={() => setShowNueva(false)}
          onGuardar={cargarCausas}
        />
      )}

      {/* Filtros */}
      <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        <input
          placeholder="Buscar ROL, demandado, demandante..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {['Todos', ...ESTADOS].map(e => (
            <button
              key={e}
              className="btn btn-ghost btn-sm"
              style={filtroEstado === e
                ? { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gold-bg)' }
                : {}}
              onClick={() => setFiltroEstado(e)}
            >{e}</button>
          ))}
          <button
            className="btn btn-sm"
            style={filtroCBR
              ? { background: 'var(--violet-bg)', border: '1px solid rgba(167,139,250,.3)', color: 'var(--violet)' }
              : { background: 'none', border: '1px solid var(--bdr)', color: 'var(--txt-mid)' }}
            onClick={() => setFiltroCBR(!filtroCBR)}
          >CBR {filtroCBR ? '✓' : ''}</button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--txt-mid)' }}>
          <span className="spin" style={{ fontSize: 32 }}>⚙</span>
          <div style={{ marginTop: 8 }}>Cargando causas...</div>
        </div>
      )}

      {/* Lista causas */}
      {!loading && filtradas.map(c => (
        <div key={c.id} className="card" style={{ padding: '13px 16px', marginBottom: 8 }}>
          <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="row" style={{ marginBottom: 4, flexWrap: 'wrap', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', fontFamily: "'DM Mono', monospace" }}>
                  {c.rol}
                </span>
                {c.n_interno && (
                  <span className="tag" style={{ color: 'var(--violet)', background: 'var(--violet-bg)', border: '1px solid rgba(167,139,250,.3)' }}>
                    N°Int: {c.n_interno}
                  </span>
                )}
                <Badge estado={c.estado} />
                {c.pjud && (
                  <span className="tag" style={{ color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid rgba(96,165,250,.3)' }}>
                    PJUD ✓
                  </span>
                )}
                {c.distancia > 0 && (
                  <span className="tag" style={{ color: 'var(--amber)', background: 'var(--amber-bg)', border: '1px solid rgba(251,191,36,.3)' }}>
                    +KM
                  </span>
                )}
                {c.cbr && (
                  <span className="tag" style={{ color: 'var(--violet)', background: 'var(--violet-bg)', border: '1px solid rgba(167,139,250,.3)' }}>
                    CBR {c.caratula_cbr ? `· ${c.caratula_cbr}` : ''}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', marginBottom: 2 }}>
                {c.demandante} <span style={{ color: 'var(--txt-lo)', fontWeight: 300 }}>vs</span> {c.demandado}
              </div>
              <div style={{ fontSize: 10, color: 'var(--txt-mid)' }}>{c.tribunal}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--gold)', fontFamily: "'Cormorant Garamond', serif" }}>
                ${(c.monto || 0).toLocaleString('es-CL')}
              </div>
              {c.distancia > 0 && (
                <div style={{ fontSize: 9, color: 'var(--amber)' }}>
                  + ${c.distancia.toLocaleString('es-CL')} dist.
                </div>
              )}
            </div>

            <div className="row" style={{ gap: 5, flexWrap: 'wrap' }}>
              <button className="btn btn-sm" style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-lo)', color: 'var(--gold)' }}>
                🤖 Estampe
              </button>
              <button className="btn btn-blue btn-sm">✏ Editar</button>
              <button className="btn btn-red btn-sm" onClick={() => eliminarCausa(c.id)}>🗑</button>
            </div>
          </div>
        </div>
      ))}

      {!loading && filtradas.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--txt-mid)' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚖</div>
          <div>
            {causas.length === 0
              ? 'No hay causas aún — crea la primera'
              : 'No hay causas que coincidan con el filtro'}
          </div>
        </div>
      )}
    </div>
  );
}