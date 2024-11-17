const redis = require('redis');
require('dotenv').config();

// Create a Redis client using the URL from the .env file
const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.error('Error connecting to Redis', err));

async function cargarAviones() {
  try {
    await client.connect(); // Connect to Redis

    // Example data to load into Redis with a unique `id` field
    const aviones = [
      {
        id: 1,
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
        id: 2,
        modelo: "Boeing 747",
        fabricante: "Boeing",
        tipo: "Comercial",
        capacidad: 366,
        velocidad_maxima: "988 km/h",
        año_lanzamiento: 1969,
        aerolineas_usuarias: ["Lufthansa", "British Airways", "Korean Air"],
        imagen: "/Imagenes/aviones/avion_5.jpg"
      },
      {
        id: 3,
        modelo: "Airbus A330",
        fabricante: "Airbus",
        tipo: "Comercial",
        capacidad: 277,
        velocidad_maxima: "913 km/h",
        año_lanzamiento: 1994,
        aerolineas_usuarias: ["Turkish Airlines", "Delta Air Lines", "KLM"],
        imagen: "/Imagenes/aviones/avion_10.jpg"
      },
      {
        id: 4,
        modelo: "Airbus A350",
        fabricante: "Airbus",
        tipo: "Comercial",
        capacidad: 440,
        velocidad_maxima: "945 km/h",
        año_lanzamiento: 2013,
        aerolineas_usuarias: ["Qatar Airways", "Cathay Pacific", "Lufthansa"],
        imagen: "/Imagenes/aviones/avion_7.jpg"
      },
      {
        id: 5,
        modelo: "Airbus A380",
        fabricante: "Airbus Grande",
        tipo: "Comercial",
        capacidad: 555,
        velocidad_maxima: "1020 km/h",
        año_lanzamiento: 2005,
        aerolineas_usuarias: ["Emirates", "Qatar Airways", "Singapore Airlines"],
        imagen: "/Imagenes/aviones/avion_1.jpg"
      },
      {
        id: 6,
        modelo: "Boeing 737",
        fabricante: "Boeing",
        tipo: "Comercial",
        capacidad: 162,
        velocidad_maxima: "850 km/h",
        año_lanzamiento: 1968,
        aerolineas_usuarias: ["Southwest Airlines", "Ryanair", "United Airlines"],
        imagen: "/Imagenes/aviones/avion_6.jpg"
      },
      {
        id: 7,
        modelo: "Boeing 777",
        fabricante: "Boeing",
        tipo: "Comercial",
        capacidad: 396,
        velocidad_maxima: "950 km/h",
        año_lanzamiento: 1994,
        aerolineas_usuarias: ["Emirates", "Cathay Pacific", "ANA All Nippon Airways"],
        imagen: "/Imagenes/aviones/avion_9.jpg"
      },
      {
        id: 8,
        modelo: "Boeing 787 Dreamliner",
        fabricante: "Boeing",
        tipo: "Comercial",
        capacidad: 242,
        velocidad_maxima: "913 km/h",
        año_lanzamiento: 2009,
        aerolineas_usuarias: ["United Airlines", "American Airlines", "British Airways"],
        imagen: "/Imagenes/aviones/avion_8.jpg"
      },
      {
        id: 9,
        modelo: "Bombardier CRJ900",
        fabricante: "Bombardier",
        tipo: "Comercial",
        capacidad: 90,
        velocidad_maxima: "876 km/h",
        año_lanzamiento: 2001,
        aerolineas_usuarias: ["Delta Connection", "Lufthansa Regional", "SAS"],
        imagen: "/Imagenes/aviones/avion_12.jpg"
      },
      {
        id: 10,
        modelo: "Embraer E175",
        fabricante: "Embraer",
        tipo: "Comercial",
        capacidad: 78,
        velocidad_maxima: "876 km/h",
        año_lanzamiento: 2003,
        aerolineas_usuarias: ["American Eagle", "Alaska Airlines", "SkyWest Airlines"],
        imagen: "/Imagenes/aviones/avion_11.jpg"
      },
      {
        id: 11,
        modelo: "Embraer E190",
        fabricante: "Embraer",
        tipo: "Comercial",
        capacidad: 100,
        velocidad_maxima: "871 km/h",
        año_lanzamiento: 2004,
        aerolineas_usuarias: ["JetBlue Airways", "KLM", "Azul Brazilian Airlines"],
        imagen: "/Imagenes/aviones/avion_5.jpg"
      },
      {
        id: 12,
        modelo: "McDonnell Douglas MD-80",
        fabricante: "McDonnell Douglas2",
        tipo: "Comercial",
        capacidad: 155,
        velocidad_maxima: "871 km/h",
        año_lanzamiento: 1980,
        aerolineas_usuarias: ["Delta Air Lines", "Alitalia", "Aeromexico"],
        imagen: "/Imagenes/aviones/avion_3.jpg"
      }
    ];

    // Delete old data before inserting new data (optional)
    await client.del('planes');

    // Insert each plane into the `planes` list in Redis
    for (const avion of aviones) {
      await client.rPush('planes', JSON.stringify(avion));
    }

    console.log('Datos de aviones cargados correctamente en Redis Cloud con IDs');
  } catch (err) {
    console.error('Error cargando datos de aviones en Redis Cloud:', err);
  } finally {
    client.quit(); // Close the Redis connection
  }
}

// Execute the function to load data
cargarAviones();
