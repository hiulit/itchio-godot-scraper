const cheerio = require('cheerio')
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
    let promiseArray = []
    // let gamesByTitle = []

    for (let i = 0; i < games.length; i++) {
      const game = games[i]

      let gameTitleRequest = req.params.title
      gameTitleRequest = gameTitleRequest.replace(/([a-z0-9])([A-Z])/g, '$1 $2') // Split camelCase words
      gameTitleRequest = gameTitleRequest.replace(/_/g, ' ') // Remove underscores
      gameTitleRequest = gameTitleRequest.replace(/Jam/g, '') // Remove the word 'Jam'
      gameTitleRequest = gameTitleRequest.split(' ') // Split words separated by spaces
      gameTitleRequest = gameTitleRequest.map(function (x) {
        return x.toUpperCase()
      })

      let scrapeWords = game.scrapeWords.map(function (x) {
        return x.toUpperCase()
      })

      // How many words match
      let intersection = gameTitleRequest.filter(element =>
        scrapeWords.includes(element)
      )
      game.intersection = intersection.length

      if (intersection.length) {
        promiseArray.push(
          getGame(game.link).then(body => {
            let $ = cheerio.load(body)
            let rating = $('.aggregate_rating').attr('title')
            if (rating) {
              game['rating'] = rating
            }
            // gamesByTitle.push(game)
            // console.log(gamesByTitle)
            return game
          })
        )
      }

      // if (
      //   // TO DO
      //   // If same word found, check the length of the word to determine it's more valid.
      //   game.title.toUpperCase() === req.params.title.toUpperCase() ||
      //   game.title.toUpperCase().includes(req.params.title.toUpperCase()) ||
      //   req.params.title.toUpperCase().includes(game.title.toUpperCase())
      // ) {
      //   // console.log(game.link)
      //   promiseArray.push(
      //     getGame(game.link).then(body => {
      //       let $ = cheerio.load(body)
      //       let rating = $('.aggregate_rating').attr('title')
      //       if (rating) {
      //         game['rating'] = rating
      //       }
      //       gamesByTitle.push(game)
      //       // console.log(gamesByTitle)
      //       return game
      //     })
      //   )
      // }
    }
    // console.log(Promise.all(promiseArray))
    // res.json(gamesByTitle)
    Promise.all(promiseArray).then(function (response) {
      console.log(response)
      // let finalGame
      let intersections = []

      for (let i = 0; i < response.length; i++) {
        const elem = response[i]
        // if (elem.scrapeWords.length === elem.intersection) {
        //   finalGame = elem
        //   break
        // }
        intersections.push(elem.intersection)
      }
      
      if (intersections.length) {
        res.json(response[intersections.indexOf(Math.max(...intersections))]) // Return only the game with the greatest intersection number
      } else {
        res.json({})
      }
    })
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
