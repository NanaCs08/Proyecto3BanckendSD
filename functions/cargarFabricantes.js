const redis = require('redis');
require('dotenv').config();

// Crear un cliente Redis usando la URL del archivo .env
const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.error('Error conectando a Redis', err));

async function cargarFabricantes() {
  try {
    await client.connect(); // Conectar a Redis

    // Datos de ejemplo para cargar en Redis
    const fabricantes = [
      {
        nombre: "Airbus",
        pais_origen: "Francia",
        año_fundacion: 1970,
        modelos_fabricados: ["Airbus A320", "Airbus A330", "Airbus A380", "Airbus A350"],
        imagen: "/Imagenes/fabricantes/fabricante_1.jpg"
      },
      {
        nombre: "Boeing",
        pais_origen: "Estados Unidos",
        año_fundacion: 1916,
        modelos_fabricados: ["Boeing 737", "Boeing 747", "Boeing 777", "Boeing 787 Dreamliner"],
        imagen: "/Imagenes/fabricantes/fabricante_2.jpg"
      }
    ];

    // Insertar cada fabricante en la lista `manufacturers` en Redis
    for (const fabricante of fabricantes) {
      await client.rPush('manufacturers', JSON.stringify(fabricante));
    }

    console.log('Datos de fabricantes cargados correctamente en Redis Cloud');
  } catch (err) {
    console.error('Error cargando datos de fabricantes en Redis Cloud:', err);
  } finally {
    client.quit(); // Cerrar la conexión a Redis
  }
}

// Ejecutar la función para cargar datos
cargarFabricantes();
