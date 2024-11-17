const redis = require('redis');
require('dotenv').config();

// Create a Redis client using the URL from the .env file
const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.error('Error connecting to Redis', err));

async function loadManufacturers() {
  try {
    await client.connect(); // Connect to Redis

    // Example data to load into Redis with a unique `id` field
    const manufacturers = [
      {
        id: 1, // Unique ID
        nombre: "Airbus",
        pais_origen: "Francia",
        año_fundacion: 1970,
        modelos_fabricados: [
          "Airbus A320",
          "Airbus A330",
          "Airbus A380",
          "Airbus A350"
        ],
        imagen: "/Imagenes/fabricantes/fabricante_1.jpg"
      },
      {
        id: 2, // Unique ID
        nombre: "Boeing",
        pais_origen: "Estados Unidos",
        año_fundacion: 1916,
        modelos_fabricados: [
          "Boeing 737",
          "Boeing 747",
          "Boeing 777",
          "Boeing 787"
        ],
        imagen: "/Imagenes/fabricantes/fabricante_2.jpg"
      },
      {
        id: 3, // Unique ID
        nombre: "Bombardier",
        pais_origen: "Canadá",
        año_fundacion: 1942,
        modelos_fabricados: ["Bombardier CRJ900"],
        imagen: "/Imagenes/fabricantes/fabricante_5.jpg"
      },
      {
        id: 4, // Unique ID
        nombre: "Embraer",
        pais_origen: "Brasil",
        año_fundacion: 1969,
        modelos_fabricados: ["Embraer E190", "Embraer E175"],
        imagen: "/Imagenes/fabricantes/fabricante_3.jpg"
      },
      {
        id: 5, // Unique ID
        nombre: "Lockheed",
        pais_origen: "Estados Unidos",
        año_fundacion: 1912,
        modelos_fabricados: [
          "Lockheed L-1011 TriStar",
          "Lockheed C-130 Hercules",
          "Lockheed F-22 Raptor"
        ],
        imagen: "/Imagenes/fabricantes/fabricante_6.jpg"
      },
      {
        id: 6, // Unique ID
        nombre: "McDonnell Douglas",
        pais_origen: "Estados Unidos",
        año_fundacion: 1967,
        modelos_fabricados: ["McDonnell Douglas MD-80"],
        imagen: "/Imagenes/fabricantes/fabricante_2.jpg"
      }
    ];

    // Delete old data before inserting new data (optional)
    await client.del('manufacturers');

    // Insert each manufacturer into the `manufacturers` list in Redis
    for (const manufacturer of manufacturers) {
      await client.rPush('manufacturers', JSON.stringify(manufacturer));
    }

    console.log('Manufacturer data successfully loaded into Redis Cloud with IDs');
  } catch (err) {
    console.error('Error loading manufacturer data into Redis Cloud:', err);
  } finally {
    client.quit(); // Close the Redis connection
  }
}

// Execute the function to load data
loadManufacturers();
