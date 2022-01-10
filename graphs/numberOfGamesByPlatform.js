const fs = require('fs')
const path = require('path')
const graphGenerator = require('../graph-generator')

let numberOfGamesByPlatform = function () {
  let games = JSON.parse(fs.readFileSync(path.resolve('all.json')))

  let platformsData = {}

  for (let index = 0; index < games.length; index++) {
    const game = games[index]

    if (game.platforms && game.platforms.length) {
      for (let index = 0; index < game.platforms.length; index++) {
        const platform = game.platforms[index]

        platformsData[platform] = platformsData[platform] + 1 || 1
      }
    } else {
      platformsData['No Platform'] = platformsData['No Platform'] + 1 || 1
    }
  }

  var graphData = {
    type: 'doughnut',
    name: 'number-of-games-by-platform',
    title: `Number of games by platform (Total: ${games.length})`,
    showLegend: true,
    labels: Object.keys(platformsData),
    labelsAnchor: 'center',
    datasets: Object.values(platformsData)
  }

  graphGenerator.generate(graphData)
}

module.exports = numberOfGamesByPlatform
