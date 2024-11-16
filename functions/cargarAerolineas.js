const redis = require('redis');
require('dotenv').config();

// Crear un cliente Redis usando la URL del archivo .env
const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.error('Error conectando a Redis', err));

async function cargarAerolíneas() {
  try {
    await client.connect(); // Conectar a Redis

    // Datos de ejemplo para cargar en Redis
    const aerolineas = [
      {
        nombre: "British Airways",
        pais_origen: "Reino Unido",
        flota: 277,
        modelos_operados: ["Boeing 747", "Airbus A320", "Boeing 787 Dreamliner"],
        imagen: "/Imagenes/aerolineas/aerolinea_6.png"
      },
      {
        nombre: "Air France",
        pais_origen: "Francia",
        flota: 212,
        modelos_operados: ["Airbus A380", "Boeing 777", "Airbus A320"],
        imagen: "/Imagenes/aerolineas/aerolinea_7.png"
      }
    ];

    // Insertar cada aerolínea en la lista `airlines` en Redis
    for (const aerolinea of aerolineas) {
      await client.rPush('airlines', JSON.stringify(aerolinea));
    }

    console.log('Datos de aerolíneas cargados correctamente en Redis Cloud');
  } catch (err) {
    console.error('Error cargando datos de aerolíneas en Redis Cloud:', err);
  } finally {
    client.quit(); // Cerrar la conexión a Redis
  }
}

// Ejecutar la función para cargar datos
cargarAerolíneas();
