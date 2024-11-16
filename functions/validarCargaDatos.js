const redis = require('redis');
require('dotenv').config();

// Crear un cliente Redis usando la URL del archivo .env
const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.error('Error conectando a Redis', err));

async function validarCargaDatos() {
  try {
    await client.connect(); // Conectar a Redis

    // Obtener todos los datos de la lista `airlines`
    const aerolineas = await client.lRange('airlines', 0, -1);

    // Mostrar los datos
    console.log('Datos cargados en Redis:');
    aerolineas.forEach((aerolinea, index) => {
      console.log(`Aerolínea ${index + 1}:`, JSON.parse(aerolinea));
    });
  } catch (err) {
    console.error('Error validando los datos en Redis:', err);
  } finally {
    client.quit(); // Cerrar la conexión a Redis
  }
}

// Ejecutar la función para validar la carga de datos
validarCargaDatos();
