const redis = require('redis');
require('dotenv').config();

// Crear un cliente Redis usando la URL del archivo .env
const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.error('Error conectando a Redis', err));

async function cargarAviones() {
  try {
    await client.connect(); // Conectar a Redis

    // Datos de ejemplo para cargar en Redis
    const aviones = [
      {
        modelo: "Airbus A320",
        fabricante: "Airbus",
        tipo: "Comercial",
        capacidad: 150,
        velocidad_maxima: "828 km/h",
        año_lanzamiento: 1988,
        aerolineas_usuarias: ["American Airlines", "Delta Air Lines", "easyJet"],
        imagen: "/Imagenes/aviones/avion_4.jpg"
      },
      {
        modelo: "Boeing 747",
        fabricante: "Boeing",
        tipo: "Comercial",
        capacidad: 366,
        velocidad_maxima: "988 km/h",
        año_lanzamiento: 1969,
        aerolineas_usuarias: ["Lufthansa", "British Airways", "Korean Air"],
        imagen: "/Imagenes/aviones/avion_5.jpg"
      }
    ];

    // Insertar cada avión en la lista `planes` en Redis
    for (const avion of aviones) {
      await client.rPush('planes', JSON.stringify(avion));
    }

    console.log('Datos de aviones cargados correctamente en Redis Cloud');
  } catch (err) {
    console.error('Error cargando datos de aviones en Redis Cloud:', err);
  } finally {
    client.quit(); // Cerrar la conexión a Redis
  }
}

// Ejecutar la función para cargar datos
cargarAviones();
