import { MercadoPagoConfig, Preference } from 'mercadopago';

// Inicializa con tu ACCESS_TOKEN de Producción o Prueba
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { items, mesa_id } = req.body;

    try {
      const preference = new Preference(client);
      
      const result = await preference.create({
        body: {
          items: items.map(item => ({
            title: item.nombre,
            unit_price: Number(item.precio),
            quantity: Number(item.cantidad),
            currency_id: 'ARS' // O tu moneda local
          })),
          back_urls: {
            success: `https://tu-app.vercel.app/mesa/${mesa_id}?status=success`,
            failure: `https://tu-app.vercel.app/mesa/${mesa_id}?status=failure`,
            pending: `https://tu-app.vercel.app/mesa/${mesa_id}?status=pending`,
          },
          auto_return: 'approved',
          external_reference: mesa_id, // Para saber qué mesa pagó
        }
      });

      res.status(200).json({ id: result.id });
    } catch (error) {
      res.status(500).json({ error: 'Error al crear preferencia' });
    }
  } else {
    res.status(405).json({ message: 'Método no permitido' });
  }
}

