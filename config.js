// const dotenv = require('dotenv') // We use 'nodemon -r dotenv/config index.js' instead.

// dotenv.config() // We use 'nodemon -r dotenv/config index.js' instead.

module.exports = {
  scraperUrl: process.env.SCRAPER_URL,
  apiUrl: process.env.API_URL,
  port: process.env.PORT
}
