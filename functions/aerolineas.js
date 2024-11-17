const redis = require('redis');
const amqp = require('amqplib'); // To connect to RabbitMQ
require('dotenv').config();

// Create a Redis client using the URL from the .env file
const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.error('Error connecting to Redis', err));

// Connect to Redis and initialize `last_airline_id`
client.connect().then(async () => {
  const currentId = await client.get('last_airline_id');
  if (currentId === null) {
    await client.set('last_airline_id', 3); // Initialize to 3 if not set
  }
});

// Function to connect and send messages to RabbitMQ
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
    console.error('Error sending message to RabbitMQ', err);
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
      // Get all airlines from Redis
      const airlines = await client.lRange('airlines', 0, -1);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(airlines.map(JSON.parse)),
      };
    }

    if (method === 'POST') {
      // Create a new airline with an incremental ID
      const data = JSON.parse(event.body);
      const newId = await client.incr('last_airline_id'); // Increment the ID
      data.id = newId;

      // Insert the new airline into the `airlines` list in Redis
      await client.rPush('airlines', JSON.stringify(data));

      // Send a message to RabbitMQ for the 'add' operation
      await sendToQueue({ action: 'add', entity: 'airline', data });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data),
      };
    }

    if (method === 'PUT') {
      // Update an airline in Redis
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

      // Send a message to RabbitMQ for the 'update' operation
      await sendToQueue({ action: 'update', entity: 'airline', data: updatedAirline });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedAirline),
      };
    }

    if (method === 'DELETE') {
      // Get `id` from the query string parameters
      const { id } = event.queryStringParameters || {};
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'ID is required for deletion' }),
        };
      }

      const airlines = await client.lRange('airlines', 0, -1);
      const index = airlines.findIndex((airline) => JSON.parse(airline).id === parseInt(id, 10));

      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Aerolínea no encontrada' }),
        };
      }

      // Remove the airline from the `airlines` list in Redis
      await client.lRem('airlines', 1, airlines[index]);

      // Send a message to RabbitMQ for the 'delete' operation
      await sendToQueue({ action: 'delete', entity: 'airline', id });

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
