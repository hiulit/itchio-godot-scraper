const numberOfGamesByPlatform = require('./numberOfGamesByPlatform')
const topAuthorsByGameCount = require('./topAuthorsByGameCount')

let generateGraphs = function () {
  numberOfGamesByPlatform()
  topAuthorsByGameCount()
}

module.exports = generateGraphs
