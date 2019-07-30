const cors = require('cors')
const express = require('express')
const fs = require('fs')
const { port } = require('./config')
const app = express()

app.set('port', port)
app.use(cors())

let jsonDir = 'json'
let jsonFiles = {
  all: 'all'
}

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

app.get('/', function (req, res) {
  res.redirect('/all')
})

app.get('/all', function (req, res) {
  res.send(readJSON(jsonDir + '/' + jsonFiles.all + '.json'))
})

app.get('/author/:author', function (req, res) {
  let games = []
  let data = readJSON(jsonDir + '/' + jsonFiles.all + '.json')

  for (let i = 0; i < data.length; i++) {
    const elem = data[i]

    if (elem.author.toUpperCase() === req.params.author.toUpperCase()) {
      games.push(elem)
    }
  }
  res.send(games)
})

app.get('/platform/:platform', function (req, res) {
  let games = []
  let data = readJSON(jsonDir + '/' + jsonFiles.all + '.json')

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

app.listen(port, () => console.log(`App started on port ${port}.`))
// module.exports = app
