import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { TRIBUNALES_POR_CORTE } from '../data/tribunales';

const ESTADOS = [
  'Pendiente', 'En Proceso', 'Firmado', 'Subido PJUD',
  'Error PJUD', 'Enviado a Cobro', 'Pendiente de Pago', 'Pagado'
];

// Validar formato RUT chileno XX.XXX.XXX-X
function validarRUT(rut) {
  if (!rut) return true; // opcional
  const limpio = rut.replace(/\./g, '').replace(/-/g, '');
  if (limpio.length < 2) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1).toUpperCase();
  let suma = 0, multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  const dvEsperado = 11 - (suma % 11);
  const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  return dv === dvCalculado;
}

// Formatear RUT mientras escribe
function formatearRUT(valor) {
  const limpio = valor.replace(/\./g, '').replace(/-/g, '').replace(/[^0-9kK]/g, '');
  if (limpio.length <= 1) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpoFormateado}-${dv}`;
}

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
  const [corteSeleccionada, setCorteSeleccionada] = useState('');
  const [tiposGestion, setTiposGestion]           = useState([]);
  const [competencias, setCompetencias]           = useState([]);
  const [clientes, setClientes]                   = useState([]);
  const [carterasDisp, setCarterasDisp]           = useState([]);
  const [esCBR, setEsCBR]                         = useState(false);
  const [pjudBuscado, setPjudBuscado]             = useState(false);
  const [buscandoPJUD, setBuscandoPJUD]           = useState(false);
  const [guardando, setGuardando]                 = useState(false);
  const [rutErrors, setRutErrors]                 = useState({});

  const [form, setForm] = useState({
    rol: '', demandante: '', demandado: '',
    tipo: '', competencia: '', nInterno: '',
    cliente: '', clienteId: '', cartera: '',
    tribunal: '', caratulaCBR: ''
  });

  const [notificados, setNotificados] = useState([
    { nombre: '', rut: '', domicilio: '', comuna: '' }
  ]);

  const setF = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      // Config por defecto
      const { data: cfg } = await supabase
        .from('configuracion')
        .select('corte, tribunal')
        .single();
      if (cfg?.corte) {
        setCorteSeleccionada(cfg.corte);
        setForm(p => ({ ...p, tribunal: cfg.tribunal || TRIBUNALES_POR_CORTE[cfg.corte]?.[0] || '' }));
      }

      // Tipos de gestión
      const { data: tipos } = await supabase
        .from('tipos_gestion')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      if (tipos) setTiposGestion(tipos);

      // Competencias
      const { data: comps } = await supabase
        .from('competencias')
        .select('*')
        .eq('activo', true)
        .order('nombre');
      if (comps) setCompetencias(comps);

      // Clientes
      const { data: cls } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre');
      if (cls) setClientes(cls);
    };
    cargarDatos();
  }, []);

  // Cuando cambia cliente cargar sus carteras
  const handleClienteChange = async (e) => {
    const nombre = e.target.value;
    const cliente = clientes.find(c => c.nombre === nombre);
    setForm(p => ({ ...p, cliente: nombre, clienteId: cliente?.id || '', cartera: '' }));

    if (cliente?.id) {
      const { data } = await supabase
        .from('carteras')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('nombre');
      setCarterasDisp(data || []);
    } else {
      setCarterasDisp([]);
    }
  };

  // Validar RUT al salir del campo
  const handleRutBlur = (i, valor) => {
    if (valor && !validarRUT(valor)) {
      setRutErrors(p => ({ ...p, [i]: 'RUT inválido' }));
    } else {
      setRutErrors(p => { const n = { ...p }; delete n[i]; return n; });
    }
  };

  // Formatear RUT mientras escribe
  const handleRutChange = (i, valor) => {
    const formateado = formatearRUT(valor);
    setNotificados(p => p.map((x, j) => j === i ? { ...x, rut: formateado } : x));
  };

  const simPJUD = () => {
    if (!form.rol) return;
    setBuscandoPJUD(true);
    setTimeout(() => {
      setForm(p => ({
        ...p,
        demandante: 'Banco Santander',
        demandado:  'Constructora ABC Ltda.',
        cliente:    'ASINVERCO',
        cartera:    'Banco Santander',
      }));
      setNotificados([{
        nombre:    'Juan Pérez López',
        rut:       '12.345.678-9',
        domicilio: 'Av. Providencia 1234, Dpto 5',
        comuna:    'Providencia'
      }]);
      setPjudBuscado(true);
      setBuscandoPJUD(false);
    }, 1600);
  };

  const addNotificado    = () => setNotificados(p => [...p, { nombre: '', rut: '', domicilio: '', comuna: '' }]);
  const copyPrev         = i  => setNotificados(p => p.map((n, j) => j === i ? { ...n, domicilio: p[i-1].domicilio, comuna: p[i-1].comuna } : n));
  const removeNotificado = i  => setNotificados(p => p.filter((_, j) => j !== i));

  const guardar = async () => {
    if (!form.rol || !form.tribunal) {
      alert('ROL y Tribunal son obligatorios');
      return;
    }
    if (Object.keys(rutErrors).length > 0) {
      alert('Hay RUTs inválidos — corrígelos antes de guardar');
      return;
    }
    setGuardando(true);
    try {
      const { error } = await supabase
        .from('causas')
        .insert([{
          rol:          form.rol,
          n_interno:    form.nInterno || null,
          tribunal:     form.tribunal,
          tipo:         form.tipo,
          competencia:  form.competencia,
          demandante:   form.demandante,
          demandado:    form.demandado,
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

  const inputVerde = val => pjudBuscado && val
    ? { borderColor: 'var(--green)', background: 'var(--green-bg)' }
    : {};

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
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🔗</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)' }}>Autocompletar desde PJUD</span>
          {pjudBuscado && <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700, marginLeft: 8 }}>✓ Datos obtenidos</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 8 }}>
          {/* ROL */}
          <div className="col" style={{ gap: 4 }}>
            <div className="sl" style={{ marginBottom: 4 }}>ROL *</div>
            <input placeholder="C-1234-2025" value={form.rol} onChange={setF('rol')} />
          </div>
          {/* Competencia */}
          <div className="col" style={{ gap: 4 }}>
            <div className="sl" style={{ marginBottom: 4 }}>Competencia</div>
            <select value={form.competencia} onChange={setF('competencia')}>
              <option value="">Seleccionar...</option>
              {competencias.map(c => <option key={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          {/* Corte */}
          <div className="col" style={{ gap: 4 }}>
            <div className="sl" style={{ marginBottom: 4 }}>Corte</div>
            <select
              value={corteSeleccionada}
              onChange={e => {
                const c = e.target.value;
                setCorteSeleccionada(c);
                setForm(p => ({ ...p, tribunal: TRIBUNALES_POR_CORTE[c]?.[0] || '' }));
              }}
            >
              {Object.keys(TRIBUNALES_POR_CORTE).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {/* Tribunal */}
          <div className="col" style={{ gap: 4 }}>
            <div className="sl" style={{ marginBottom: 4 }}>Tribunal *</div>
            <select value={form.tribunal} onChange={setF('tribunal')}>
              {(TRIBUNALES_POR_CORTE[corteSeleccionada] || []).map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {/* Botón buscar */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-blue" onClick={simPJUD} disabled={buscandoPJUD}>
              {buscandoPJUD ? <span className="spin">⚙</span> : '🔍'} Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Datos principales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        {/* Demandante */}
        <div className="col" style={{ gap: 4 }}>
          <div className="sl" style={{ marginBottom: 4 }}>Demandante</div>
          <input placeholder="Nombre o razón social" value={form.demandante} onChange={setF('demandante')} style={inputVerde(form.demandante)} />
        </div>
        {/* Demandado */}
        <div className="col" style={{ gap: 4 }}>
          <div className="sl" style={{ marginBottom: 4 }}>Demandado</div>
          <input placeholder="Nombre o razón social" value={form.demandado} onChange={setF('demandado')} style={inputVerde(form.demandado)} />
        </div>
        {/* Tipo de gestión */}
        <div className="col" style={{ gap: 4 }}>
          <div className="sl" style={{ marginBottom: 4 }}>Tipo de gestión *</div>
          <select value={form.tipo} onChange={setF('tipo')}>
            <option value="">Seleccionar...</option>
            {tiposGestion.map(t => <option key={t.id}>{t.nombre}</option>)}
          </select>
        </div>
        {/* N° Interno */}
        <div className="col" style={{ gap: 4 }}>
          <div className="sl" style={{ marginBottom: 4 }}>N° Interno (si aplica)</div>
          <input placeholder="Número del cliente" value={form.nInterno} onChange={setF('nInterno')} />
        </div>
        {/* Cliente */}
        <div className="col" style={{ gap: 4 }}>
          <div className="sl" style={{ marginBottom: 4 }}>Cliente</div>
          <select value={form.cliente} onChange={handleClienteChange}>
            <option value="">Seleccionar...</option>
            {clientes.map(c => <option key={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        {/* Cartera */}
        <div className="col" style={{ gap: 4 }}>
          <div className="sl" style={{ marginBottom: 4 }}>Cartera</div>
          <select value={form.cartera} onChange={setF('cartera')} disabled={carterasDisp.length === 0}>
            <option value="">Seleccionar...</option>
            {carterasDisp.map(c => <option key={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* CBR compacto */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center',
        padding: '8px 12px', marginBottom: 14,
        background: 'var(--s2)', borderRadius: 8,
        border: '1px solid var(--bdr)', flexWrap: 'wrap'
      }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
          <div
            onClick={() => setEsCBR(!esCBR)}
            style={{
              width: 17, height: 17, borderRadius: 4,
              border: `2px solid ${esCBR ? 'var(--gold)' : 'var(--bdr)'}`,
              background: esCBR ? 'var(--gold)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all .15s', flexShrink: 0
            }}
          >
            {esCBR && <span style={{ color: '#0B0F17', fontSize: 10, fontWeight: 900 }}>✓</span>}
          </div>
          <span style={{ fontSize: 12, color: 'var(--txt)' }}>CBR</span>
        </label>
        {esCBR && (
          <input
            placeholder="N° Carátula CBR"
            value={form.caratulaCBR}
            onChange={setF('caratulaCBR')}
            style={{ flex: 1, minWidth: 160 }}
          />
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
          >+ Agregar notificado</button>
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
                {i > 0 && <button className="btn btn-blue btn-sm" onClick={() => copyPrev(i)}>📋 Copiar domicilio anterior</button>}
                {i > 0 && <button className="btn btn-red btn-sm" onClick={() => removeNotificado(i)}>✕</button>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
              {/* Nombre */}
              <div className="col" style={{ gap: 4 }}>
                <div className="sl" style={{ marginBottom: 4 }}>Nombre *</div>
                <input
                  placeholder="Nombre completo"
                  value={n.nombre}
                  onChange={e => setNotificados(p => p.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))}
                  style={pjudBuscado && n.nombre ? { borderColor: 'var(--green)', background: 'var(--green-bg)' } : {}}
                />
              </div>
              {/* RUT con validación */}
              <div className="col" style={{ gap: 4 }}>
                <div className="sl" style={{ marginBottom: 4 }}>RUT</div>
                <input
                  placeholder="XX.XXX.XXX-X"
                  value={n.rut}
                  onChange={e => handleRutChange(i, e.target.value)}
                  onBlur={e => handleRutBlur(i, e.target.value)}
                  style={{
                    ...(pjudBuscado && n.rut ? { borderColor: 'var(--green)', background: 'var(--green-bg)' } : {}),
                    ...(rutErrors[i] ? { borderColor: 'var(--red)', background: 'var(--red-bg)' } : {})
                  }}
                />
                {rutErrors[i] && (
                  <span style={{ fontSize: 9, color: 'var(--red)', marginTop: 2 }}>⚠ {rutErrors[i]}</span>
                )}
              </div>
              {/* Domicilio */}
              <div className="col" style={{ gap: 4 }}>
                <div className="sl" style={{ marginBottom: 4 }}>Domicilio *</div>
                <input
                  placeholder="Calle y número"
                  value={n.domicilio}
                  onChange={e => setNotificados(p => p.map((x, j) => j === i ? { ...x, domicilio: e.target.value } : x))}
                  style={pjudBuscado && n.domicilio ? { borderColor: 'var(--green)', background: 'var(--green-bg)' } : {}}
                />
              </div>
              {/* Comuna */}
              <div className="col" style={{ gap: 4 }}>
                <div className="sl" style={{ marginBottom: 4 }}>Comuna *</div>
                <input
                  placeholder="Comuna"
                  value={n.comuna}
                  onChange={e => setNotificados(p => p.map((x, j) => j === i ? { ...x, comuna: e.target.value } : x))}
                  style={pjudBuscado && n.comuna ? { borderColor: 'var(--green)', background: 'var(--green-bg)' } : {}}
                />
              </div>
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
          {guardando ? <><span className="spin">⚙</span> Guardando...</> : 'Crear Causa'}
        </button>
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

export default function Causas() {
  const [causas, setCausas]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [filtroCBR, setFiltroCBR]       = useState(false);
  const [search, setSearch]             = useState('');
  const [showNueva, setShowNueva]       = useState(false);
  const [showAlert, setShowAlert]       = useState(true);

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
          <button onClick={() => setShowAlert(false)} style={{ background: 'none', border: 'none', color: 'var(--txt-mid)', cursor: 'pointer', fontSize: 18 }}>×</button>
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

      {showNueva && <NuevaCausa onClose={() => setShowNueva(false)} onGuardar={cargarCausas} />}

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
              style={filtroEstado === e ? { borderColor: 'var(--gold)', color: 'var(--gold)', background: 'var(--gold-bg)' } : {}}
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
                {c.competencia && (
                  <span className="tag" style={{ color: 'var(--blue)', background: 'var(--blue-bg)', border: '1px solid rgba(96,165,250,.3)' }}>
                    {c.competencia}
                  </span>
                )}
                <Badge estado={c.estado} />
                {c.pjud && (
                  <span className="tag" style={{ color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid rgba(52,211,153,.3)' }}>
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
              <div style={{ fontSize: 10, color: 'var(--txt-mid)' }}>
                {c.tribunal} {c.tipo && `· ${c.tipo}`}
              </div>
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