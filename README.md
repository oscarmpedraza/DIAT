# Front End Store

## Publicar en Vercel y mantener copia local

La aplicación publicada guarda los pedidos en MongoDB Atlas. MongoDB Compass no es una base de datos remota: muestra la instancia de MongoDB que tengas instalada localmente. Para mantener ambas copias, ejecuta periódicamente la sincronización desde la computadora donde está MongoDB local:

```powershell
npm run sync:local
```

La sincronización copia los pedidos de Atlas a `frontend_store.pedidos` local y se puede ejecutar cada vez que quieras actualizar Compass. No se expone el puerto local `27017` a Internet.

Para Vercel:

1. Importa este proyecto en Vercel.
2. Configura las variables `MONGODB_URI` y `MONGODB_DB` en **Project Settings > Environment Variables**. Usa como `MONGODB_URI` la cadena de conexión de Atlas.
3. Despliega el proyecto. Vercel publicará la página y la API.

Para sincronizar localmente, configura en `.env`:

```text
MONGODB_ATLAS_URI=tu cadena de conexión de Atlas
MONGODB_LOCAL_URI=mongodb://127.0.0.1:27017
MONGODB_DB=frontend_store
```

## Ejecutar localmente

1. Instala Node.js 18 o superior.
2. Instala MongoDB Community Server y asegúrate de que el servicio esté iniciado.
3. En MongoDB Compass, conecta con `mongodb://127.0.0.1:27017`.
4. Copia `.env.example` como `.env` y deja `MONGODB_URI=mongodb://127.0.0.1:27017` para trabajar localmente.
5. Instala dependencias y arranca el servidor:

```powershell
npm install
npm start
```

Abre `http://localhost:3000`. No abras `index.html` directamente: el pedido necesita pasar por la API.

Cada confirmación crea un documento en la colección `pedidos` de la base `frontend_store`. En Compass, abre la conexión local y selecciona `frontend_store > pedidos` para verlos. El servidor valida productos, tallas, cantidades y precios usando su catálogo antes de guardar. El carrito se puede modificar localmente; solo se persiste el estado final al confirmar el pedido.

La configuración de conexión usa un único `MongoClient` reutilizado por el servidor y un pool inicial de 10 conexiones, una suposición conservadora para una tienda local o de bajo tráfico. Ajusta ese valor después de medir concurrencia y conexiones en producción.
