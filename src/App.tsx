import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BrowserRouter, Routes, Route, useParams, Link } from 'react-router-dom';
import './App.css';

// 1. Configuración de Supabase (usa las variables de Vercel)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// --- COMPONENTE PRINCIPAL (RUTAS) ---
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta para el cliente: ej. tu-app.vercel.app/mesa/1 */}
        <Route path="/mesa/:idMesa" element={<MenuCliente />} />
        {/* Ruta para el administrador/mozo */}
        <Route path="/admin" element={<AdminPanel />} />
        {/* Ruta de bienvenida/error */}
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div className="container" style={{ textAlign: 'center' }}>
      <h1>Bienvenido 🍽️</h1>
      <p>Por favor, escanea el código QR de tu mesa para ver el menú.</p>
      <Link to="/admin" style={{ fontSize: '12px', color: '#ccc' }}>Acceso Staff</Link>
    </div>
  );
}

// --- COMPONENTE: PANEL DE ADMINISTRACIÓN ---
function AdminPanel() {
  const [mesas, setMesas] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  useEffect(() => {
    fetchAdminData();
    // Suscripción Realtime: Escucha CUALQUIER cambio en la base de datos
    const channel = supabase.channel('dashboard-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        fetchAdminData();
        reproducirAlerta(); // Sonido para avisar al mozo
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, fetchAdminData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchAdminData() {
    const resMesas = await supabase.from('mesas').select('*').order('numero_mesa');
    const resPedidos = await supabase.from('pedidos').select('*').order('creado_at', { ascending: false });
    setMesas(resMesas.data || []);
    setPedidos(resPedidos.data || []);
  }

  // Cambiar el estado del pedido (Pendiente -> Preparando -> Entregado)
  async function actualizarPedido(id: number, nuevoEstado: string) {
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id);
    fetchAdminData();
  }

  function reproducirAlerta() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => console.log("Interacción requerida para audio"));
  }

  // Filtramos pedidos según lo que el mozo necesite ver
  const pedidosFiltrados = filtroEstado === 'TODOS' 
    ? pedidos 
    : pedidos.filter(p => p.estado === filtroEstado);

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h2>Dashboard Operativo 🛠️</h2>
        <div className="admin-stats">
          <span>Pedidos hoy: {pedidos.length}</span>
        </div>
      </header>

      {/* Gestión de Mesas (Ya lo tenemos, se mantiene igual) */}
      <section className="admin-section">
        <h3>Control de Mesas (Anti-Spam)</h3>
        <div className="mesa-grid">
          {mesas.map(m => (
            <div key={m.id} className={`mesa-card ${m.estado}`}>
              <h4>Mesa {m.numero_mesa}</h4>
              <button className="btn-mesa-toggle" onClick={() => cambiarEstadoMesa(m.id, m.estado)}>
                {m.estado === 'LIBRE' ? 'Abrir Mesa' : 'Cerrar Mesa'}
              </button>
            </div>
          ))}
        </div>
      </section>
                {/* Filtros de Gestión */}
      <div className="admin-filters">
        <button className={filtroEstado === 'TODOS' ? 'active' : ''} onClick={() => setFiltroEstado('TODOS')}>Todos</button>
        <button className={filtroEstado === 'PENDIENTE' ? 'active' : ''} onClick={() => setFiltroEstado('PENDIENTE')}>Pendientes</button>
        <button className={filtroEstado === 'ENTREGADO' ? 'active' : ''} onClick={() => setFiltroEstado('ENTREGADO')}>Entregados</button>
      </div>

      <section className="pedidos-section">
        <h3>Comandas Activas</h3>
        <div className="pedidos-grid">
          {pedidosFiltrados.map(p => (
            <div key={p.id} className={`pedido-card status-${p.estado}`}>
              <div className="pedido-header">
                <span className="pedido-mesa">Mesa #{p.mesa_id}</span>
                <span className="pedido-hora">{new Date(p.creado_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              
              <div className="pedido-items">
                {p.items?.map((item: any, index: number) => (
                  <div key={index} className="item-detalle">
                    <span>{item.nombre}</span>
                    <span className="item-precio">${item.precio}</span>
                  </div>
                ))}
              </div>

              <div className="pedido-footer">
                <div className="pedido-total">Total: <strong>${p.total}</strong></div>
                <div className="pedido-acciones">
                  {p.estado === 'PENDIENTE' && (
                    <button className="btn-preparar" onClick={() => actualizarPedido(p.id, 'PREPARANDO')}>Empezar</button>
                  )}
                  {p.estado === 'PREPARANDO' && (
                    <button className="btn-entregar" onClick={() => actualizarPedido(p.id, 'ENTREGADO')}>Entregar</button>
                  )}
                  <span className="estado-badge">{p.estado}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
                                                                                     }

// --- COMPONENTE: MENÚ DEL CLIENTE ---
function MenuCliente() {
  const { idMesa } = useParams();
  const [loading, setLoading] = useState(true);
  const [isHabilitada, setIsHabilitada] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);

  useEffect(() => {
    validarMesaYMenu();
  }, [idMesa]);

  async function validarMesaYMenu() {
    // 1. Validar si la mesa está OCUPADA (habilitada por el mozo)
    const { data: mesa } = await supabase
      .from('mesas')
      .select('estado')
      .eq('numero_mesa', idMesa)
      .single();

    if (mesa?.estado === 'OCUPADA') {
      setIsHabilitada(true);
      // 2. Si está OK, traer menú
      const resCat = await supabase.from('categorias').select('*').order('orden');
      const resProd = await supabase.from('productos').select('*').eq('stock', true);
      setCategorias(resCat.data || []);
      setProductos(resProd.data || []);
    }
    setLoading(false);
  }

  const enviarPedido = async () => {
    const total = carrito.reduce((acc, p) => acc + p.precio, 0);
    const { error } = await supabase.from('pedidos').insert([
      { mesa_id: idMesa, items: carrito, total: total, estado: 'PENDIENTE' }
    ]);

    if (!error) {
      alert("¡Pedido enviado con éxito!");
      setCarrito([]);
    }
  };

  if (loading) return <div className="loader">Cargando menú delicioso...</div>;

  if (!isHabilitada) return (
    <div className="bloqueo">
      <h2>Mesa #{idMesa} no habilitada 🚫</h2>
      <p>Por favor, solicita a un mozo que habilite tu mesa para comenzar a pedir.</p>
    </div>
  );

  return (
    <div className="container">
      <header className="header">
        <h1>Nuestro Menú</h1>
        <div className="chip-mesa">Mesa #{idMesa}</div>
      </header>

      {/* Apartado de Recomendados */}
      <div className="recomended-section">
        <h3>Recomendación de la casa ⭐</h3>
        <div className="scroll-horizontal">
          {productos.filter(p => p.recomendado).map(p => (
            <div key={p.id} className="chip-recomendado">{p.nombre}</div>
          ))}
        </div>
      </div>

      {categorias.map(cat => (
        <section key={cat.id} className="cat-section">
          <h2 className="cat-title">{cat.nombre}</h2>
          <div className="grid-productos">
            {productos.filter(p => p.categoria_id === cat.id).map(prod => (
              <div key={prod.id} className="card-prod">
                <img src={prod.imagen_url} className="img-prod" alt={prod.nombre} />
                <div className="info-prod">
                  <h3>{prod.nombre}</h3>
                  <p>{prod.descripcion}</p>
                  <div className="price-row">
                    <span className="price">${prod.precio}</span>
                    <button className="add-btn" onClick={() => setCarrito([...carrito, prod])}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Carrito Flotante (Solo si hay items) */}
      {carrito.length > 0 && (
        <div className="floating-cart">
          <div className="cart-info">
            <span>Total:</span>
            <strong>${carrito.reduce((a, b) => a + b.precio, 0).toFixed(2)}</strong>
          </div>
          <button className="btn-pedir" onClick={enviarPedido}>Realizar Pedido</button>
        </div>
      )}
    </div>
  );
        }
      
