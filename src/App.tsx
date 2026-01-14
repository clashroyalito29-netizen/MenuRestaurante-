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

  useEffect(() => {
    fetchAdminData();
    // Suscripción en tiempo real para nuevos pedidos
    const channel = supabase.channel('cambios-restaurante')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, fetchAdminData)
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

  async function cambiarEstadoMesa(id: number, estadoActual: string) {
    const nuevoEstado = estadoActual === 'LIBRE' ? 'OCUPADA' : 'LIBRE';
    await supabase.from('mesas').update({ estado: nuevoEstado }).eq('id', id);
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h2>Panel de Control 🛠️</h2>
        <Link to="/" className="btn-volver">Cerrar Sesión</Link>
      </header>

      <section>
        <h3>Estado de Mesas (Anti-Spam)</h3>
        <div className="mesa-grid">
          {mesas.map(m => (
            <div key={m.id} className={`mesa-card ${m.estado}`}>
              <h4>Mesa {m.numero_mesa}</h4>
              <p>{m.estado}</p>
              <button onClick={() => cambiarEstadoMesa(m.id, m.estado)}>
                {m.estado === 'LIBRE' ? 'Habilitar QR' : 'Cerrar Mesa'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '40px' }}>
        <h3>Pedidos Recientes</h3>
        <div className="pedidos-list">
          {pedidos.map(p => (
            <div key={p.id} className="pedido-item">
              <span>Mesa {p.mesa_id} - <strong>${p.total}</strong></span>
              <span className={`status-${p.estado}`}>{p.estado}</span>
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
      
