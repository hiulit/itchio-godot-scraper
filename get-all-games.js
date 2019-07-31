const cheerio = require('cheerio')
const fs = require('fs')
const request = require('request')

const http = require('http')
const https = require('https')
http.globalAgent.maxSockets = 3
https.globalAgent.maxSockets = 3

let base_url = 'https://itch.io/games/made-with-godot'
let items_per_page = 30

function flattenDeep (arr) {
  return arr.reduce(
    (acc, val) =>
      Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val),
    []
  )
}

function writeJSON (data, path) {
  if (!data) {
    throw new Error('Function needs a valid JSON as a first parameter!')
  }
  if (path === '' || path === undefined) {
    throw new Error('Function needs a path (string) as a second parameter!')
  } else if (typeof path !== 'string' || path instanceof String) {
    name.toString()
  }

  try {
    fs.writeFileSync(path + '.json', JSON.stringify(data, null, 2))
    console.log()
    console.log('"' + path + '.json" has been created successfully!')
    console.log()
  } catch (err) {
    console.error(err)
  }
}

function scraper (url) {
  return new Promise(function (resolve, reject) {
    request(url, function (err, resp, body) {
      var $ = cheerio.load(body)

      var results = []

      if (err) {
        reject(err)
      } else {
        if ($('.game_cell').length) {
          $('.game_cell').each(function (i, elem) {
            let game = {}

            game.thumb = $(elem)
              .find('.game_thumb')
              .attr('data-background_image')
            game.title = $(elem)
              .find('.game_cell_data .game_title .title.game_link')
              .text()
            game.desc = $(elem)
              .find('.game_cell_data .game_text')
              .text()
            game.author = $(elem)
              .find('.game_cell_data .game_author')
              .text()

            let platforms = []
            $(elem)
              .find('.game_cell_data .game_platform')
              .children()
              .each(function (i, elem) {
                platform = $(elem).attr('title')
                if (platform) {
                  platform = platform.replace('Download for ', '')
                  platforms.push(platform)
                }
              })
            game.platforms = platforms

            results.push(game)
          })
        } else {
          results.push({ 'No results in:': url })
        }

        resolve(results)
      }
    })
  })
}

function getAllGames () {
  request(base_url, function (error, response, html) {
    if (!error) {
      var $ = cheerio.load(html)

      max_pages = parseInt(
        $('.game_count')
          .text()
          .match(/[0-9.,]+/g)[0]
          .replace(',', '')
      )
      // console.log(max_pages)
      n_pages = Math.ceil(max_pages / items_per_page)
      // n_pages = 1
      // console.log(n_pages)

      var urls = []
      for (let i = 1; i < n_pages + 1; i++) {
        let url = base_url + '?page=' + i
        urls.push(url)
      }

      var scrapers = urls.map(scraper)

      Promise.all(scrapers).then(
        function (scrapes) {
          // "scrapes" collects the results from all pages.
          scrapes = flattenDeep(scrapes)

          console.log(scrapes)
          writeJSON(scrapes, 'all.json')
        },
        function (error) {
          // At least one of them went wrong.
          console.log('error', error)
        }
      )
    }
  })
}

getAllGames()
