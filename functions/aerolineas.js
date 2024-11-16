const redis = require('redis');
const amqp = require('amqplib'); // Para conectar a RabbitMQ
require('dotenv').config();

// Crear un cliente Redis usando la URL del archivo .env
const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.error('Error conectando a Redis', err));
client.connect(); // Conectar a Redis

// Función para conectar y enviar mensajes a RabbitMQ
async function sendToQueue(message) {
  try {
    const connection = await amqp.connect(process.env.CLOUDAMQP_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue('bookstore', { durable: true });
    channel.sendToQueue('bookstore', Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    await channel.close();
    await connection.close();
  } catch (err) {
    console.error('Error enviando mensaje a RabbitMQ', err);
  }
}

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: 'OK',
    };
  }

  try {
    const method = event.httpMethod;

    if (method === 'GET') {
      // Obtener todas las aerolíneas desde Redis
      const airlines = await client.lRange('airlines', 0, -1);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(airlines.map(JSON.parse)),
      };
    }

    if (method === 'POST') {
      // Crear una nueva aerolínea
      const data = JSON.parse(event.body);
      await client.rPush('airlines', JSON.stringify(data));

      // Enviar mensaje a RabbitMQ para operación 'add'
      await sendToQueue({ action: 'add', entity: 'airline', data });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data),
      };
    }

    if (method === 'PUT') {
      // Actualizar una aerolínea en Redis
      const { nombre, ...updateData } = JSON.parse(event.body);
      const airlines = await client.lRange('airlines', 0, -1);
      const index = airlines.findIndex((airline) => JSON.parse(airline).nombre === nombre);

      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Aerolínea no encontrada' }),
        };
      }

      const updatedAirline = { ...JSON.parse(airlines[index]), ...updateData };
      await client.lSet('airlines', index, JSON.stringify(updatedAirline));

      // Enviar mensaje a RabbitMQ para operación 'update'
      await sendToQueue({ action: 'update', entity: 'airline', data: updatedAirline });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedAirline),
      };
    }

    if (method === 'DELETE') {
      // Eliminar una aerolínea de Redis
      const { nombre } = JSON.parse(event.body);
      const airlines = await client.lRange('airlines', 0, -1);
      const index = airlines.findIndex((airline) => JSON.parse(airline).nombre === nombre);

      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Aerolínea no encontrada' }),
        };
      }

      await client.lRem('airlines', 1, airlines[index]);

      // Enviar mensaje a RabbitMQ para operación 'delete'
      await sendToQueue({ action: 'delete', entity: 'airline', nombre });

      return {
        statusCode: 204,
        headers,
        body: JSON.stringify({ message: 'Aerolínea eliminada exitosamente' }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Método no permitido' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
