// src/components/BotonPago.tsx
import { useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

// Inicializa tu PUBLIC_KEY (no es secreto, va en el front)
initMercadoPago('TU_PUBLIC_KEY', { locale: 'es-AR' });

export const BotonPago = ({ items, mesaId }: { items: any[], mesaId: string }) => {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, mesa_id: mesaId }),
      });
      const data = await response.json();
      setPreferenceId(data.id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mt-4">
      {!preferenceId ? (
        <button 
          onClick={handleBuy}
          disabled={loading}
          className={`
            w-full py-3 rounded-xl font-bold text-ice-dark
            bg-gradient-to-r from-ice-accent to-blue-400
            shadow-lg shadow-blue-500/30
            transition-all active:scale-95
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}
          `}
        >
          {loading ? 'Procesando...' : 'Pagar Pedido'}
        </button>
      ) : (
        <div className="animate-fadeIn">
           {/* El botón oficial de MP (Wallet) aparece aquí */}
           <Wallet initialization={{ preferenceId: preferenceId }} />
        </div>
      )}
    </div>
  );
};

