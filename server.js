const cors = require('cors')
const express = require('express')
const fs = require('fs')
const http = require('http')
const request = require('request')
const { port } = require('./config')
const app = express()

console.log(process.env.NODE_ENV)

app.set('port', port)
app.use(cors())

function readJSON (path) {
  if (path === '' || path === undefined) {
    throw new Error('Function needs a path (string) as a parameter!')
  } else if (typeof path !== 'string' || path instanceof String) {
    name.toString()
  }

  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'))
  } catch (err) {
    console.error(err)
    return false
  }
}

let data

if (process.env.NODE_ENV === 'production') {
  console.log('I\'m in production mode!')
  request(
    'https://raw.githubusercontent.com/hiulit/itchio-scraper/master/json/all.json',
    function (err, res, body) {
      data = JSON.parse(body)
    }
  )
} else if (process.env.NODE_ENV === 'development') {
  data = readJSON('all.json')
}

app.get('/', function (req, res) {
  res.redirect('/api')
})

app.get('/api', function (req, res) {
  res.send(data)
})

app.get('/api/author/:author', function (req, res) {
  let games = []

  for (let i = 0; i < data.length; i++) {
    const elem = data[i]

    if (elem.author.toUpperCase() === req.params.author.toUpperCase()) {
      games.push(elem)
    }
  }
  res.send(games)
})

app.get('/api/platform/:platform', function (req, res) {
  let games = []

  for (let i = 0; i < data.length; i++) {
    const elem = data[i]

    if (elem.platforms.length) {
      for (let j = 0; j < elem.platforms.length; j++) {
        const platform = elem.platforms[j]

        if (platform.toUpperCase() === req.params.platform.toUpperCase()) {
          games.push(elem)
        }
      }
    }
  }
  res.send(games)
})

const server = http.createServer(app)
server.listen(port, () => console.log(`App started on port ${port}.`))

module.exports = app
