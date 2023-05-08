const cheerio = require('cheerio')
const compression = require('compression')
const cors = require('cors')
const express = require('express')
const getAuthors = require('./helpers/getAuthors')
const getAuthorsByGameCount = require('./helpers/getAuthorsByGameCount')
const getGame = require('./helpers/getGame')
const getGameByID = require('./helpers/getGameByID')
const getGames = require('./helpers/getGames')
const getGamesByAuthor = require('./helpers/getGamesByAuthor')
const getGamesByPlatform = require('./helpers/getGamesByPlatform')
const getGamesTitles = require('./helpers/getGamesTitles')
const getObjectByMaxValueAttribute = require('./utils/getObjectByMaxValueAttribute')
const getPlatforms = require('./helpers/getPlatforms')
const path = require('path')

const app = express()
const port = 5000

if (process.env.NODE_ENV === 'development') app.use(express.static(__dirname))

app.set('port', port)
app.use(cors())
app.use(compression())

const apiUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:' + port + '/all.json'
    : 'https://raw.githubusercontent.com/hiulit/itchio-scraper/master/all.json'

app.get('/', (req, res) => {
  res.redirect('/api')
})

app.get('/api', (req, res) => {
  getGames(apiUrl).then(games => {
    res.json(games)
  })
})

app.get('/api/games', (req, res) => {
  getGames(apiUrl).then(games => {
    let titles = getGamesTitles(games)

    res.json(titles)
  })
})

app.get('/api/game/title/:title', function (req, res) {
  getGames(apiUrl).then(games => {
    let promiseArray = []

    for (let i = 0; i < games.length; i++) {
      const game = games[i]

      let gameTitleRequest = req.params.title
      // Remove extension if matching Godot's game extensions.
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
      let matchedGames = []

      for (let i = 0; i < response.length; i++) {
        const elem = response[i]
        intersections.push(elem.intersections)
        // Add games to 'matchedGames' that match 'scrapeWords' with 'intersections'.
        if (elem.scrapeWords.length === elem.intersections) {
          matchedGames.push(elem)
        }
      }

      if (intersections.length) {
        // Best case scenario is if there are 'matchedGames',
        // those are games that match 'scrapeWords' with 'intersections'.
        if (matchedGames.length) {
          // Return only the game with the greatest intersection number.
          res.json(getObjectByMaxValueAttribute(matchedGames, 'intersections'))
          return
        }
        // Check if every intersection is the same (and it has more than one intersection).
        // If so, return an empty json because it means there are too many options.
        if (
          intersections.length > 1 &&
          intersections.every((val, i, arr) => val === arr[0])
        ) {
          res.json({})
          return
        }
        // If none of the above conditions are met,
        // return only the game with the greatest intersection number.
        res.json(response[intersections.indexOf(Math.max(...intersections))])
      } else {
        res.json({})
      }
    })
  })
})

app.get('/api/game/id/:id', (req, res) => {
  getGames(apiUrl).then(games => {
    let gameByID = getGameByID(games, req.params.id)

    if (gameByID) {
      res.json(gameByID)
    } else {
      res.json({})
    }
  })
})

app.get('/api/authors', (req, res) => {
  getGames(apiUrl).then(games => {
    let authors = getAuthors(games)

    if (authors) {
      res.json(authors)
    } else {
      res.json({})
    }
  })
})

app.get('/api/authors/top/:number', function (req, res) {
  getGames(apiUrl).then(games => {
    let topAuthors = getAuthorsByGameCount(games, req.params.number)

    if (topAuthors) {
      res.json(topAuthors)
    } else {
      res.json({})
    }
  })
})

app.get('/api/author/:author', function (req, res) {
  getGames(apiUrl).then(games => {
    let gamesByAuthor = getGamesByAuthor(games, req.params.author)

    if (gamesByAuthor) {
      res.json(gamesByAuthor)
    } else {
      res.json({})
    }
  })
})

app.get('/api/platforms', (req, res) => {
  getGames(apiUrl).then(games => {
    let platforms = getPlatforms(games)

    if (platforms) {
      res.json(platforms)
    } else {
      res.json({})
    }
  })
})

app.get('/api/platform/:platform', function (req, res) {
  getGames(apiUrl).then(games => {
    let gamesByPlatforms = getGamesByPlatform(games, req.params.platform)

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
