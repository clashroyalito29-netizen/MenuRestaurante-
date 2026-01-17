// src/store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem { id: number; nombre: string; precio: number; cantidad: number }

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => set((state) => {
        // Lógica simple para sumar cantidad si ya existe
        const exists = state.items.find(i => i.id === newItem.id);
        if (exists) {
          return {
            items: state.items.map(i => i.id === newItem.id ? { ...i, cantidad: i.cantidad + 1 } : i)
          };
        }
        return { items: [...state.items, { ...newItem, cantidad: 1 }] };
      }),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)
    }),
    { name: 'restaurante-cart-storage' } // Nombre en localStorage
  )
);

