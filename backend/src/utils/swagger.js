// backend/utils/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Learning API Documentation',
      version: '1.0.0',
      description: 'Tài liệu API cho đồ án Hệ Cơ sở dữ liệu nâng cao',
      contact: {
        name: 'Nguyen Thanh Tu'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
  },
  apis: [
    path.join(__dirname, '../routes/*.route.js'),
    path.join(__dirname, '../../docs/*.yaml')
  ],

};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;