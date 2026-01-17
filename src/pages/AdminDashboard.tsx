// src/pages/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import useSound from 'use-sound'; // Instalar: npm install use-sound
import bellSfx from '../assets/sounds/notification.mp3';

export const AdminDashboard = () => {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [play] = useSound(bellSfx);

  useEffect(() => {
    // 1. Cargar pedidos iniciales
    const fetchPedidos = async () => {
      const { data } = await supabase
        .from('pedidos')
        .select('*, mesas(numero_mesa)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setPedidos(data);
    };
    fetchPedidos();

    // 2. Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('pedidos_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
        console.log('Nuevo pedido!', payload);
        play(); // Alerta sonora
        // Agregamos el nuevo pedido al estado
        setPedidos((prev) => [payload.new, ...prev]); 
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [play]);

  return (
    <div className="min-h-screen bg-ice-dark p-6 text-ice-text">
      <h1 className="text-3xl font-bold mb-6">Cocina / Comandas</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="glass-panel p-4 animate-fadeIn">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xl font-bold text-ice-accent">Mesa {pedido.mesas?.numero_mesa || '?'}</span>
              <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                {pedido.estado}
              </span>
            </div>
            {/* Renderizar items del JSON */}
            <ul className="text-sm text-gray-300 space-y-1">
              {pedido.items.map((item: any, idx: number) => (
                 <li key={idx}>{item.cantidad}x {item.nombre}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
          
