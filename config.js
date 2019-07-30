// const dotenv = require('dotenv') // We use 'nodemon -r dotenv/config server.js' instead.

// dotenv.config() // We use 'nodemon -r dotenv/config server.js' instead.

module.exports = {
  // endpoint: process.env.API_URL,
  // masterKey: process.env.API_KEY,
  port: process.env.PORT
}
