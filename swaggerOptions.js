const { link } = require('fs');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GoHire Backend API Node.js-Epxress.js',
      version: '1.0.0',
      description: 'GoHire - A rental and seller base project. visit now [https://gohire-frontend-eqqmb.ondigitalocean.app/](https://gohire-frontend-eqqmb.ondigitalocean.app/)',
    },
    servers: [
      {
        url: 'http://localhost:7000',
      },
      {
        url:"https://gohire-backend-nj2d7.ondigitalocean.app/"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // Optional, but helps indicate the token format
          description: ' Enter your token in the format `Bearer <token>`'
        },
      },
    },
    security: [
      {
        bearerAuth: [],  // Apply security scheme to all endpoints by default
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to your API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
