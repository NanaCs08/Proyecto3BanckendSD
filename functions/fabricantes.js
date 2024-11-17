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
      // Obtener todos los fabricantes desde Redis
      const manufacturers = await client.lRange('manufacturers', 0, -1);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(manufacturers.map(JSON.parse)),
      };
    }

    if (method === 'POST') {
      // Crear un nuevo fabricante con un id incremental
      const data = JSON.parse(event.body);

      // Incrementar el id y obtener el nuevo id
      const newId = await client.incr('last_manufacturer_id');
      data.id = newId; // Asignar el nuevo id al fabricante

      // Insertar el nuevo fabricante en la lista `manufacturers` en Redis
      await client.rPush('manufacturers', JSON.stringify(data));

      // Enviar mensaje a RabbitMQ para operación 'add'
      await sendToQueue({ action: 'add', entity: 'manufacturer', data });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data),
      };
    }

    if (method === 'PUT') {
      // Actualizar un fabricante en Redis
      const { nombre, ...updateData } = JSON.parse(event.body);
      const manufacturers = await client.lRange('manufacturers', 0, -1);
      const index = manufacturers.findIndex((manufacturer) => JSON.parse(manufacturer).nombre === nombre);

      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Fabricante no encontrado' }),
        };
      }

      const updatedManufacturer = { ...JSON.parse(manufacturers[index]), ...updateData };
      await client.lSet('manufacturers', index, JSON.stringify(updatedManufacturer));

      // Enviar mensaje a RabbitMQ para operación 'update'
      await sendToQueue({ action: 'update', entity: 'manufacturer', data: updatedManufacturer });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedManufacturer),
      };
    }

    if (method === 'DELETE') {
      // Obtener `id` de los parámetros de consulta
      const { id } = event.queryStringParameters || {};
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'ID is required for deletion' }),
        };
      }
    
      const manufacturers = await client.lRange('manufacturers', 0, -1);
      const index = manufacturers.findIndex((manufacturer) => JSON.parse(manufacturer).id === parseInt(id, 10));
    
      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Fabricante no encontrado' }),
        };
      }
    
      // Eliminar el fabricante de la lista `manufacturers` en Redis
      await client.lRem('manufacturers', 1, manufacturers[index]);
    
      // Enviar mensaje a RabbitMQ para operación 'delete'
      await sendToQueue({ action: 'delete', entity: 'manufacturer', id });
    
      return {
        statusCode: 204,
        headers,
        body: JSON.stringify({ message: 'Fabricante eliminado exitosamente' }),
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
