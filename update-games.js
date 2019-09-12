const cheerio = require('cheerio')
const fs = require('fs')
const readline = require('readline')
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

function sortByKey(array, key) {
  return array.sort(function(a, b) {
    var x = a[key]
    var y = b[key]
    return x < y ? -1 : x > y ? 1 : 0
  })
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

      function waitingPercent(p) {
        readline.clearLine(process.stdout, 0)
        readline.cursorTo(process.stdout, 0)
        text =
          'Scraping progress for ' +
          url.url.substring(0, url.url.indexOf('?')) +
          ': ' +
          percentage_progress +
          '% of ' +
          url.maxPages +
          ' games.'
        process.stdout.write(text)
      }

      waitingPercent(percentage_progress)

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
            game.author = game.author ? game.author : null

            game.description = $(elem)
              .find('.game_cell_data .game_text')
              .text()
            game.description = game.description ? game.description : null

            game.genre = $(elem)
              .find('.game_cell_data .game_genre')
              .text()
            game.genre = game.genre ? game.genre : null

            game.id = $(elem).attr('data-game_id')
            game.id = game.id ? game.id : null

            game.link = $(elem)
              .find('.game_cell_data .game_title .title.game_link')
              .attr('href')
            game.link = game.link ? game.link : null

            let platforms = []
            $(elem)
              .find('.game_cell_data .game_platform')
              .children()
              .each(function(i, elem) {
                let platform = $(elem).attr('title')
                if (platform) {
                  platform = platform.replace('Download for ', '')
                  platforms.push(platform)
                }
              })
            game.platforms = platforms.length ? platforms : null

            game.thumb = $(elem)
              .find('.game_thumb')
              .attr('data-background_image')
            game.thumb = game.thumb ? game.thumb : null

            game.title = $(elem)
              .find('.game_cell_data .game_title .title.game_link')
              .text()
            game.title = game.title ? game.title : null

            game.video = $(elem)
              .find('.game_thumb .gif_overlay')
              .attr('data-gif')
            game.video = game.video ? game.video : null

            let scrapeWords = game.title
            // Remove special characters
            scrapeWords = scrapeWords.replace(
              /[&\/\\#,+()$~%.'":*!¡?¿<>{}@]/g,
              ''
            )
            // Separate camelCase words
            scrapeWords = scrapeWords.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            // Create an array of words separated by spaces
            scrapeWords = scrapeWords.split(' ')
            // Remove some values from the array
            scrapeWords = scrapeWords.filter(function(el) {
              return el !== ('-' || '_')
            })
            // Remove booleans from array (null, undefined, false, '') but no the number '0'.
            scrapeWords = scrapeWords.filter(el => el === 0 || Boolean(el))

            // console.log(scrapeWords)
            game.scrapeWords = scrapeWords
            game.scrapeWords = scrapeWords.length ? scrapeWords : null

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

              final = sortByKey(final, 'id')

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
