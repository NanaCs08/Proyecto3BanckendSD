const redis = require('redis');
const amqp = require('amqplib'); // Para conectar a RabbitMQ
require('dotenv').config();

// Crear un cliente Redis usando la URL del archivo .env
const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.error('Error conectando a Redis', err));
client.connect().then(async () => {
  // Verificar si `last_plane_id` ya está configurado; si no, establecerlo en 2
  const currentId = await client.get('last_plane_id');
  if (currentId === null) {
    await client.set('last_plane_id', 2); // Configura el valor inicial a 2
  }
});

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
      const planes = await client.lRange('planes', 0, -1);

      // Check if there is an 'id' query parameter
      const { id } = event.queryStringParameters || {};
      if (id) {
        const plane = planes.map(JSON.parse).find((plane) => plane.id === parseInt(id));
        if (!plane) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Plane not found' }),
          };
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(plane),
        };
      }

      // If no 'id' is provided, return all planes
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(planes.map(JSON.parse)),
      };
    }

    if (method === 'POST') {
      const data = JSON.parse(event.body);
      const newId = await client.incr('last_plane_id');
      data.id = newId;
      await client.rPush('planes', JSON.stringify(data));
      await sendToQueue({ action: 'add', entity: 'plane', data });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data),
      };
    }

    if (method === 'PUT') {
      const { modelo, ...updateData } = JSON.parse(event.body);
      const planes = await client.lRange('planes', 0, -1);
      const index = planes.findIndex((plane) => JSON.parse(plane).modelo === modelo);

      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Plane not found' }),
        };
      }

      const updatedPlane = { ...JSON.parse(planes[index]), ...updateData };
      await client.lSet('planes', index, JSON.stringify(updatedPlane));
      await sendToQueue({ action: 'update', entity: 'plane', data: updatedPlane });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedPlane),
      };
    }

    if (method === 'DELETE') {
      const { modelo } = JSON.parse(event.body);
      const planes = await client.lRange('planes', 0, -1);
      const index = planes.findIndex((plane) => JSON.parse(plane).modelo === modelo);

      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Plane not found' }),
        };
      }

      await client.lRem('planes', 1, planes[index]);
      await sendToQueue({ action: 'delete', entity: 'plane', modelo });

      return {
        statusCode: 204,
        headers,
        body: JSON.stringify({ message: 'Plane deleted successfully' }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
