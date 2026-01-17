// src/components/TableGuard.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const TableGuard = ({ children }: { children: React.ReactNode }) => {
  const { idMesa } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMesa = async () => {
      if (!idMesa) return navigate('/error');

      const { data, error } = await supabase
        .from('mesas')
        .select('estado')
        .eq('id', idMesa)
        .single();

      if (error || data.estado !== 'OCUPADA') {
        // Si no existe o no está ocupada, bloqueamos acceso
        navigate('/espera'); // Pantalla "Pide a tu mesero que habilite la mesa"
      } else {
        setLoading(false);
      }
    };
    checkMesa();
  }, [idMesa, navigate]);

  if (loading) return <div className="text-ice-accent">Verificando mesa...</div>;

  return <>{children}</>;
};
