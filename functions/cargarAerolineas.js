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

    // Datos de ejemplo para cargar en Redis, con un campo `id` único
    const aerolineas = [
      {
        id: 1, // ID único
        nombre: "British Airways",
        pais_origen: "Reino Unido",
        flota: 277,
        modelos_operados: ["Boeing 747", "Airbus A320", "Boeing 787 Dreamliner"],
        imagen: "/Imagenes/aerolineas/aerolinea_6.png"
      },
      {
        id: 2, // ID único
        nombre: "Air France",
        pais_origen: "Francia",
        flota: 212,
        modelos_operados: ["Airbus A380", "Boeing 777", "Airbus A320"],
        imagen: "/Imagenes/aerolineas/aerolinea_7.png"
      },
      {
        id: 3,
        nombre: "American Airlines",
        pais_origen: "Estados Unidos",
        flota: 945,
        modelos_operados: ["Boeing 737", "Airbus A320", "Boeing 787 Dreamliner"],
        imagen: "/Imagenes/aerolineas/aerolinea_1.png"
      },
      {
        id: 4,
        nombre: "Delta Air Lines",
        pais_origen: "Estados Unidos",
        flota: 865,
        modelos_operados: ["Boeing 737", "Airbus A320", "McDonnell Douglas MD-80"],
        imagen: "/Imagenes/aerolineas/aerolinea_4.png"
      },
      {
        id: 5,
        nombre: "Emirates",
        pais_origen: "Emiratos",
        flota: 260,
        modelos_operados: ["Airbus A380", "Boeing 777", "Boeing 787 Dreamliner"],
        imagen: "/Imagenes/aerolineas/aerolinea_3.PNG"
      },
      {
        id: 6,
        nombre: "Lufthansa",
        pais_origen: "Alemania",
        flota: 266,
        modelos_operados: ["Boeing 747", "Airbus A320", "Airbus A380"],
        imagen: "/Imagenes/aerolineas/aerolinea_2.png"
      },
      {
        id: 7,
        nombre: "Qatar Airways",
        pais_origen: "Catar",
        flota: 235,
        modelos_operados: ["Boeing 777", "Airbus A350", "Airbus A380"],
        imagen: "/Imagenes/aerolineas/aerolinea_5.png"
      }
    ];

    // Eliminar los datos antiguos antes de insertar los nuevos (opcional)
    await client.del('airlines');

    // Insertar cada aerolínea en la lista `airlines` en Redis
    for (const aerolinea of aerolineas) {
      await client.rPush('airlines', JSON.stringify(aerolinea));
    }

    console.log('Datos de aerolíneas cargados correctamente en Redis Cloud con IDs');
  } catch (err) {
    console.error('Error cargando datos de aerolíneas en Redis Cloud:', err);
  } finally {
    client.quit(); // Cerrar la conexión a Redis
  }
}

// Ejecutar la función para cargar datos
cargarAerolíneas();
