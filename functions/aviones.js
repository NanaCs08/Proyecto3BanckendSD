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
      // Obtener todos los aviones desde Redis
      const planes = await client.lRange('planes', 0, -1);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(planes.map(JSON.parse)),
      };
    }

    if (method === 'POST') {
      // Crear un nuevo avión con un id incremental
      const data = JSON.parse(event.body);

      // Incrementar el id y obtener el nuevo id
      const newId = await client.incr('last_plane_id');
      data.id = newId; // Asignar el nuevo id al avión

      // Insertar el nuevo avión en la lista `planes` en Redis
      await client.rPush('planes', JSON.stringify(data));

      // Enviar mensaje a RabbitMQ para operación 'add'
      await sendToQueue({ action: 'add', entity: 'plane', data });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data),
      };
    }

    if (method === 'PUT') {
      // Actualizar un avión en Redis
      const { modelo, ...updateData } = JSON.parse(event.body);
      const planes = await client.lRange('planes', 0, -1);
      const index = planes.findIndex((plane) => JSON.parse(plane).modelo === modelo);

      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Avión no encontrado' }),
        };
      }

      const updatedPlane = { ...JSON.parse(planes[index]), ...updateData };
      await client.lSet('planes', index, JSON.stringify(updatedPlane));

      // Enviar mensaje a RabbitMQ para operación 'update'
      await sendToQueue({ action: 'update', entity: 'plane', data: updatedPlane });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedPlane),
      };
    }

    if (method === 'DELETE') {
      // Eliminar un avión de Redis
      const { modelo } = JSON.parse(event.body);
      const planes = await client.lRange('planes', 0, -1);
      const index = planes.findIndex((plane) => JSON.parse(plane).modelo === modelo);

      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Avión no encontrado' }),
        };
      }

      await client.lRem('planes', 1, planes[index]);

      // Enviar mensaje a RabbitMQ para operación 'delete'
      await sendToQueue({ action: 'delete', entity: 'plane', modelo });

      return {
        statusCode: 204,
        headers,
        body: JSON.stringify({ message: 'Avión eliminado exitosamente' }),
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
