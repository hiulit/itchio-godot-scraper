// const dotenv = require('dotenv') // We use 'nodemon -r dotenv/config index.js' instead.

// dotenv.config() // We use 'nodemon -r dotenv/config index.js' instead.

module.exports = {
  endpoint: process.env.API_URL,
  port: process.env.PORT
}
