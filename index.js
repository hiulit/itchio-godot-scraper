const cheerio = require('cheerio')
const cors = require('cors')
const express = require('express')
const fetch = require('node-fetch')
const path = require('path')

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

async function getGame (url) {
  const response = await fetch(url)
  return response.text()
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
    let titles = []

    for (let i = 0; i < games.length; i++) {
      const game = games[i]

      if (!titles.includes(game.title)) {
        titles.push(game.title)
      }
    }
    res.json(titles)
  })
})

app.get('/api/game/title/:title', function (req, res) {
  getGames().then(games => {
    let promiseArray = []

    for (let i = 0; i < games.length; i++) {
      const game = games[i]

      let gameTitleRequest = req.params.title
      // Remove extension if matching Godot's games extensions.
      if (
        path.extname(gameTitleRequest) == '.pck' ||
        path.extname(gameTitleRequest) == '.zip'
      ) {
        gameTitleRequest = path.basename(
          gameTitleRequest,
          path.extname(gameTitleRequest)
        )
      }
      gameTitleRequest = gameTitleRequest.replace(/([a-z0-9])([A-Z])/g, '$1 $2') // Split camelCase words.
      gameTitleRequest = gameTitleRequest.replace(/_|-|\.|\[|\]|\{|\}/g, ' ') // Convert dashes, underscores, dots and brackets into spaces.
      gameTitleRequest = gameTitleRequest.split(' ') // Split words separated by spaces.
      gameTitleRequest = gameTitleRequest.map(function (x) {
        return x.toUpperCase()
      })

      if (game.scrapeWords) {
        let scrapeWords = game.scrapeWords.map(function (x) {
          return x.toUpperCase()
        })

        // How many words match.
        let intersections = gameTitleRequest.filter(element =>
          scrapeWords.includes(element)
        )
        game.intersections = intersections.length

        if (intersections.length) {
          promiseArray.push(
            getGame(game.link).then(body => {
              let $ = cheerio.load(body)
              let rating = $('.aggregate_rating').attr('title')
              if (rating) {
                game['rating'] = rating
              }
              return game
            })
          )
        }
      }
    }

    Promise.all(promiseArray).then(function (response) {
      let intersections = []

      for (let i = 0; i < response.length; i++) {
        const elem = response[i]
        intersections.push(elem.intersections)
        // If the scrapeWords equal to the intersections return the game.
        // Because it means that all the wods match.
        if (elem.scrapeWords.length === elem.intersections) {
          // console.log('hola')
          // console.log(elem)
          res.json(elem)
          return
        }
      }

      if (intersections.length) {
        // Check if every intersection is the same (and it has more than one intersection).
        // If so, return an empty json because it means there are too many options.
        if (
          intersections.length > 1 &&
          intersections.every((val, i, arr) => val === arr[0])
        ) {
          res.json({})
          return
        }
        // Return only the game with the greatest intersection number.
        res.json(response[intersections.indexOf(Math.max(...intersections))])
      } else {
        res.json({})
      }
    })
  })
})

app.get('/api/game/id/:id', (req, res) => {
  getGames().then(games => {
    let gameByID

    for (let i = 0; i < games.length; i++) {
      const game = games[i]

      if (game.id === req.params.id) {
        gameByID = game
        break
      }
    }

    if (gameByID) {
      res.json(gameByID)
    } else {
      res.json({})
    }
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

    if (authors) {
      res.json(authors)
    } else {
      res.json({})
    }
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

    if (gamesByAuthor) {
      res.json(gamesByAuthor)
    } else {
      res.json({})
    }
  })
})

app.get('/api/platforms', (req, res) => {
  getGames().then(games => {
    let platforms = []

    for (let i = 0; i < games.length; i++) {
      const game = games[i]

      if (game.platforms && game.platforms.length) {
        for (let j = 0; j < game.platforms.length; j++) {
          const platform = game.platforms[j]

          if (!platforms.includes(platform)) {
            platforms.push(platform)
          }
        }
      }
    }

    if (platforms) {
      res.json(platforms)
    } else {
      res.json({})
    }
  })
})

app.get('/api/platform/:platform', function (req, res) {
  getGames().then(games => {
    let gamesByPlatforms = []

    for (let i = 0; i < games.length; i++) {
      const game = games[i]

      if (game.platforms && game.platforms.length) {
        for (let j = 0; j < game.platforms.length; j++) {
          const platform = game.platforms[j]

          if (platform.toUpperCase() === req.params.platform.toUpperCase()) {
            gamesByPlatforms.push(game)
          }
        }
      }
    }

    if (gamesByPlatforms) {
      res.json(gamesByPlatforms)
    } else {
      res.json({})
    }
  })
})

app.listen(port, () => {
  console.log('Server is running at http://localhost:' + port)
})
