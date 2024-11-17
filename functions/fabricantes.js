const redis = require('redis');
const amqp = require('amqplib');
require('dotenv').config();

// Create a Redis client using the URL from the .env file
const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.error('Error connecting to Redis', err));
client.connect().then(async () => {
  // Check if `last_manufacturer_id` is set; if not, initialize it to 2
  const currentId = await client.get('last_manufacturer_id');
  if (currentId === null) {
    await client.set('last_manufacturer_id', 2);
  }
});

// Function to send messages to RabbitMQ
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
      const manufacturers = await client.lRange('manufacturers', 0, -1);
      const { id } = event.queryStringParameters || {};
      if (id) {
        const manufacturer = manufacturers.map(JSON.parse).find((m) => m.id === parseInt(id));
        if (!manufacturer) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: 'Manufacturer not found' }),
          };
        }
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(manufacturer),
        };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(manufacturers.map(JSON.parse)),
      };
    }

    if (method === 'POST') {
      const data = JSON.parse(event.body);
      const newId = await client.incr('last_manufacturer_id');
      data.id = newId;
      await client.rPush('manufacturers', JSON.stringify(data));
      await sendToQueue({ action: 'add', entity: 'manufacturer', data });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data),
      };
    }

    if (method === 'PUT') {
      const { nombre, ...updateData } = JSON.parse(event.body);
      const manufacturers = await client.lRange('manufacturers', 0, -1);
      const index = manufacturers.findIndex((m) => JSON.parse(m).nombre === nombre);

      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Manufacturer not found' }),
        };
      }

      const updatedManufacturer = { ...JSON.parse(manufacturers[index]), ...updateData };
      await client.lSet('manufacturers', index, JSON.stringify(updatedManufacturer));
      await sendToQueue({ action: 'update', entity: 'manufacturer', data: updatedManufacturer });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedManufacturer),
      };
    }

    if (method === 'DELETE') {
      const { id } = event.queryStringParameters || {};
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'ID is required for deletion' }),
        };
      }

      const manufacturers = await client.lRange('manufacturers', 0, -1);
      const index = manufacturers.findIndex((m) => JSON.parse(m).id === parseInt(id, 10));

      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Manufacturer not found' }),
        };
      }

      await client.lRem('manufacturers', 1, manufacturers[index]);
      await sendToQueue({ action: 'delete', entity: 'manufacturer', id });

      return {
        statusCode: 204,
        headers,
        body: JSON.stringify({ message: 'Manufacturer deleted successfully' }),
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
