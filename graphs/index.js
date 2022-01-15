const fs = require('fs')
const numberOfGamesByPlatform = require('./numberOfGamesByPlatform')
const path = require('path')
const topAuthorsByGameCount = require('./topAuthorsByGameCount')

let generateGraphs = function () {
  if (!fs.existsSync(path.resolve('all.json'))) {
    console.log(`ERROR: 'all.json' file doesn't exists!`)
    return
  }

  numberOfGamesByPlatform()
  topAuthorsByGameCount()
}

console.log(`
Graphs
------
`)

generateGraphs()
