require('dotenv').config();

const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const port = Number(process.env.PORT) || 3000;
const databaseName = process.env.MONGODB_DB || 'frontend_store';
const sizes = new Set(['Chica', 'Mediana', 'Grande']);
const catalog = new Map([
  [1, { name: 'VueJS', price: 25 }],
  [2, { name: 'AngularJS', price: 25 }],
  [3, { name: 'ReactJS', price: 25 }],
  [4, { name: 'Redux', price: 25 }],
  [5, { name: 'Node.js', price: 25 }],
  [6, { name: 'SASS', price: 25 }],
  [7, { name: 'HTML5', price: 25 }],
  [8, { name: 'Github', price: 25 }],
  [9, { name: 'BulmaCSS', price: 25 }],
  [10, { name: 'TypeScript', price: 25 }],
  [11, { name: 'Drupal', price: 25 }],
  [12, { name: 'JavaScript', price: 25 }],
  [13, { name: 'GraphQL', price: 25 }],
  [14, { name: 'WordPress', price: 25 }]
]);

let orders;
let client;

function cleanText(value, field, maxLength) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`El campo ${field} no es válido.`);
  }
  return value.trim();
}

function validateOrder(body) {
  const customer = body && body.cliente;
  if (!customer || !Array.isArray(body.items) || body.items.length === 0) {
    throw new Error('El pedido debe incluir datos del cliente y al menos un producto.');
  }

  const email = cleanText(customer.correo, 'correo', 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('El correo electrónico no es válido.');
  }

  const items = body.items.map((item) => {
    const productId = Number(item.productoId);
    const quantity = Number(item.cantidad);
    const product = catalog.get(productId);
    if (!product || !sizes.has(item.talla) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error('Uno de los productos del pedido no es válido.');
    }
    return {
      productoId: productId,
      nombre: product.name,
      talla: item.talla,
      cantidad: quantity,
      precioUnitario: product.price,
      total: product.price * quantity
    };
  });

  return {
    cliente: {
      nombre: cleanText(customer.nombre, 'nombre', 120),
      correo: email,
      telefono: cleanText(customer.telefono, 'telefono', 40),
      direccion: cleanText(customer.direccion, 'direccion', 200),
      ciudad: cleanText(customer.ciudad, 'ciudad', 100)
    },
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
    unidades: items.reduce((sum, item) => sum + item.cantidad, 0)
  };
}

app.use(express.json({ limit: '32kb' }));

app.post('/api/pedidos', async (req, res) => {
  try {
    const order = validateOrder(req.body);
    const number = `FS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const now = new Date();
    const document = {
      numero: number,
      ...order,
      estado: 'recibido',
      creadoEn: now,
      actualizadoEn: now
    };

    await connectDatabase();
    await orders.insertOne(document);
    res.status(201).json({ numero: number, total: order.total });
  } catch (error) {
    const status = error.message.startsWith('El ') || error.message.startsWith('Uno ') ? 400 : 500;
    console.error('Error al guardar pedido:', error);
    res.status(status).json({ error: status === 400 ? error.message : 'No se pudo guardar el pedido.' });
  }
});

app.use(express.static(path.join(__dirname)));

async function connectDatabase() {
  if (orders) {
    return orders;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Falta MONGODB_URI en la configuración del servidor.');
  }

  client = new MongoClient(mongoUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  });
  await client.connect();
  const database = client.db(databaseName);
  orders = database.collection('pedidos');
  await orders.createIndex({ numero: 1 }, { unique: true });
  await orders.createIndex({ 'cliente.correo': 1, creadoEn: -1 });
  return orders;
}

async function start() {
  await connectDatabase();
  app.listen(port, () => console.log(`Front End Store disponible en http://localhost:${port}`));
}

async function shutdown() {
  if (client) {
    await client.close();
  }
  process.exit(0);
}

if (require.main === module) {
  start().catch((error) => {
    console.error('No se pudo conectar con MongoDB:', error.message);
    process.exit(1);
  });

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = app;
