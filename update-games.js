const cheerio = require('cheerio')
const fs = require('fs')
const request = require('request')

const http = require('http')
const https = require('https')
http.globalAgent.maxSockets = 2
https.globalAgent.maxSockets = 2

let baseURL = 'https://itch.io/games/'
let scrapeURLS = ['made-with-godot', 'tag-godot']

let itemsPerPage = 30
let maxPages
let nPages

let noResults = []

let promisesDone = 0

function flattenDeep(arr) {
  return arr.reduce(
    (acc, val) =>
      Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val),
    []
  )
}

function readJSON(path) {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'))
  } catch (err) {
    console.error(err)
    return false
  }
}

function writeJSON(data, path) {
  try {
    fs.writeFileSync(path + '.json', JSON.stringify(data, null, 2))
    console.log()
    console.log(
      '\033[1;32m"' + path + '.json"\033[0m has been created successfully!'
    )
    console.log()
  } catch (err) {
    console.error(err)
  }
}

function scraper(url) {
  return new Promise(function(resolve, reject) {
    request(url.url, function(err, resp, body) {
      let percentage_progress = ((url.id * 100) / url.nPages).toFixed(0)
      process.stdout.clearLine()
      process.stdout.cursorTo(0)
      process.stdout.write(
        'Scraping progress for ' +
          url.url.substring(0, url.url.indexOf('?')) +
          ': ' +
          percentage_progress +
          '% of ' +
          url.maxPages +
          ' games.'
      )

      let $ = cheerio.load(body)

      let results = []

      if (err) {
        reject(err)
      } else {
        if ($('.game_cell').length) {
          $('.game_cell').each(function(i, elem) {
            let game = {}

            game.author = $(elem)
              .find('.game_cell_data .game_author')
              .text()

            game.description = $(elem)
              .find('.game_cell_data .game_text')
              .text()

            game.id = $(elem).attr('data-game_id')

            let platforms = []
            $(elem)
              .find('.game_cell_data .game_platform')
              .children()
              .each(function(i, elem) {
                platform = $(elem).attr('title')
                if (platform) {
                  platform = platform.replace('Download for ', '')
                  platforms.push(platform)
                }
              })
            game.platforms = platforms

            game.thumb = $(elem)
              .find('.game_thumb')
              .attr('data-background_image')

            game.title = $(elem)
              .find('.game_cell_data .game_title .title.game_link')
              .text()

            game.video = $(elem)
              .find('.game_thumb .gif_overlay')
              .attr('data-gif')

            results.push(game)
          })
        } else {
          noResults.push({ 'No results at index:': url.url })
        }

        resolve(results)
      }
    })
  })
}

function getAllGames() {
  console.log('Scraping started ...')
  console.log()

  for (let i = 0; i < scrapeURLS.length; i++) {
    const scrapeURL = scrapeURLS[i]

    request(baseURL + scrapeURL, function(error, response, html) {
      if (!error) {
        let $ = cheerio.load(html)

        maxPages = parseInt(
          $('.game_count')
            .text()
            .match(/[0-9.,]+/g)[0]
            .replace(',', '')
        )

        nPages = Math.ceil(maxPages / itemsPerPage)
        // nPages = 1

        let urls = []
        for (let i = 1; i < nPages + 1; i++) {
          const url = baseURL + scrapeURL + '?page=' + i
          urls.push({
            id: i,
            maxPages: maxPages,
            nPages: nPages,
            url: url,
          })
        }

        let scrapers = urls.map(scraper)

        Promise.all(scrapers).then(
          function(scrapes) {
            if (noResults.length) {
              console.log()
              console.log(noResults)
            }

            // "scrapes" collects the results from all pages.
            scrapes = flattenDeep(scrapes)

            writeJSON(scrapes, '.tmp/' + scrapeURL)

            promisesDone++

            if (promisesDone == scrapeURLS.length) {
              console.log('DONE!')

              let arr1 = readJSON('.tmp/' + scrapeURLS[0] + '.json')
              let arr2 = readJSON('.tmp/' + scrapeURLS[1] + '.json')

              arr1 = arr1.concat(arr2) // merge two arrays

              let foo = new Map()
              for (const key of arr1) {
                foo.set(key.title, key)
              }
              let final = [...foo.values()]

              writeJSON(final, 'all')
            }
          },
          function(error) {
            // At least one of them went wrong.
            console.log('error', error)
          }
        )
      }
    })
  }
}

getAllGames()
