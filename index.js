const cors = require('cors')
const express = require('express')
const fetch = require('node-fetch')

const app = express()
const port = 5000

if (process.env.NODE_ENV === 'development') app.use(express.static(__dirname))

app.set('port', port)
app.use(cors())

const apiUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:' + port + '/all.json'
    : 'https://raw.githubusercontent.com/hiulit/itchio-scraper/master/all.json'

async function getGames () {
  const response = await fetch(apiUrl)
  return response.json()
}

app.get('/', (req, res) => {
  res.redirect('/api')
})

app.get('/api', (req, res) => {
  getGames().then(games => {
    res.json(games)
  })
})

app.get('/api/games', (req, res) => {
  getGames().then(games => {
    let title = []

    for (let i = 0; i < games.length; i++) {
      const game = games[i]

      if (!title.includes(game.title)) {
        title.push(game.title)
      }
    }
    res.json(title)
  })
})

app.get('/api/game/:title', function (req, res) {
  getGames().then(games => {
    let gamesByTitle = []

    for (let i = 0; i < games.length; i++) {
      const game = games[i]

      if (game.title.toUpperCase() === req.params.title.toUpperCase()) {
        gamesByTitle.push(game)
      }
    }
    res.json(gamesByTitle)
  })
})

app.get('/api/authors', (req, res) => {
  getGames().then(games => {
    let authors = []

    for (let i = 0; i < games.length; i++) {
      const game = games[i]

      if (!authors.includes(game.author)) {
        authors.push(game.author)
      }
    }
    res.json(authors)
  })
})

app.get('/api/author/:author', function (req, res) {
  getGames().then(games => {
    let gamesByAuthor = []

    for (let i = 0; i < games.length; i++) {
      const game = games[i]

      if (game.author.toUpperCase() === req.params.author.toUpperCase()) {
        gamesByAuthor.push(game)
      }
    }
    res.json(gamesByAuthor)
  })
})

app.get('/api/platforms', (req, res) => {
  getGames().then(games => {
    let platforms = []

    for (let i = 0; i < games.length; i++) {
      const game = games[i]

      for (let j = 0; j < game.platforms.length; j++) {
        const platform = game.platforms[j]

        if (!platforms.includes(platform)) {
          platforms.push(platform)
        }
      }
    }
    res.json(platforms)
  })
})

app.get('/api/platform/:platform', function (req, res) {
  getGames().then(games => {
    let gamesByPlatforms = []

    for (let i = 0; i < games.length; i++) {
      const game = games[i]

      if (game.platforms.length) {
        for (let j = 0; j < game.platforms.length; j++) {
          const platform = game.platforms[j]

          if (platform.toUpperCase() === req.params.platform.toUpperCase()) {
            gamesByPlatforms.push(game)
          }
        }
      }
    }
    res.json(gamesByPlatforms)
  })
})

app.listen(port, () => {
  console.log('Server is running at http://localhost:' + port)
})
