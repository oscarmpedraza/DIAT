require('dotenv').config();

const { MongoClient } = require('mongodb');

const atlasUri = process.env.MONGODB_ATLAS_URI;
const localUri = process.env.MONGODB_LOCAL_URI || 'mongodb://127.0.0.1:27017';
const databaseName = process.env.MONGODB_DB || 'frontend_store';

if (!atlasUri) {
  console.error('Falta MONGODB_ATLAS_URI en el archivo .env.');
  process.exit(1);
}

async function syncOrders() {
  const atlasClient = new MongoClient(atlasUri, { serverSelectionTimeoutMS: 10000 });
  const localClient = new MongoClient(localUri, { serverSelectionTimeoutMS: 5000 });

  try {
    await Promise.all([atlasClient.connect(), localClient.connect()]);
    const atlasOrders = atlasClient.db(databaseName).collection('pedidos');
    const localOrders = localClient.db(databaseName).collection('pedidos');
    await localOrders.createIndex({ numero: 1 }, { unique: true });

    const documents = await atlasOrders.find({}).toArray();
    for (const document of documents) {
      const { _id, ...order } = document;
      await localOrders.replaceOne({ numero: document.numero }, order, { upsert: true });
    }

    console.log(`Sincronizados ${documents.length} pedidos de Atlas a MongoDB local.`);
  } finally {
    await Promise.all([atlasClient.close(), localClient.close()]);
  }
}

syncOrders().catch((error) => {
  console.error('No se pudieron sincronizar los pedidos:', error.message);
  process.exit(1);
});
