const mongoose = require('mongoose');
const Publisher = require('../models/Publisher');
require('dotenv').config();

// Conectar a MongoDB (solo se conecta si aún no está conectado)
if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
}

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: 'OK'
    };
  }

  try {
    const method = event.httpMethod;

    if (method === 'GET') {
      const publishers = await Publisher.find();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(publishers)
      };
    }

    if (method === 'POST') {
      const data = JSON.parse(event.body);
      const newPublisher = new Publisher(data);
      const savedPublisher = await newPublisher.save();
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(savedPublisher)
      };
    }

    if (method === 'PUT') {
      const { id, ...updateData } = JSON.parse(event.body);
      const updatedPublisher = await Publisher.findByIdAndUpdate(id, updateData, { new: true });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updatedPublisher)
      };
    }

    if (method === 'DELETE') {
      const { id } = JSON.parse(event.body);
      await Publisher.findByIdAndDelete(id);
      return {
        statusCode: 204,
        headers,
        body: JSON.stringify({ message: 'Publisher eliminado exitosamente' })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Método no permitido' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
