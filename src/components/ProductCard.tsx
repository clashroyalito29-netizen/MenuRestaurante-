// src/components/ProductCard.tsx
export const ProductCard = ({ producto, onAdd }: any) => (
  <div className="glass-panel group relative overflow-hidden transition-all hover:-translate-y-1">
    {/* Efecto de brillo al pasar el mouse */}
    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity z-0 pointer-events-none" />
    
    <div className="relative z-10 flex p-3 gap-3">
      <img 
        src={producto.imagen_url} 
        alt={producto.nombre} 
        className="w-24 h-24 rounded-lg object-cover shadow-sm"
      />
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-ice-text">{producto.nombre}</h3>
          <p className="text-xs text-slate-300 line-clamp-2">{producto.descripcion}</p>
        </div>
        <div className="flex justify-between items-end mt-2">
          <span className="text-ice-accent font-mono font-bold text-lg">
            ${producto.precio}
          </span>
          <button 
            onClick={() => onAdd(producto)}
            className="bg-white/10 hover:bg-ice-accent hover:text-ice-dark text-white p-2 rounded-lg transition-colors"
          >
            + Agregar
          </button>
        </div>
      </div>
    </div>
  </div>
);

