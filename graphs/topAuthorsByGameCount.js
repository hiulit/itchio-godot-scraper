const fs = require('fs')
const getAuthorsByGameCount = require('../helpers/getAuthorsByGameCount')
const graphGenerator = require('./generator')
const path = require('path')

let topAuthorsByGameCount = function () {
  let games = JSON.parse(fs.readFileSync(path.resolve('all.json')))
  let topAuthors = getAuthorsByGameCount(games, 10)

  let graphData = {
    type: 'bar',
    name: 'top-authors-by-game-count',
    title: 'Top authors by game count',
    showLegend: false,
    labelsAnchor: 'end'
  }

  let labels = []
  let datasets = []
  for (let index = 0; index < topAuthors.length; index++) {
    const element = topAuthors[index]
    labels.push(element.author)
    datasets.push(element.games)
  }
  graphData.labels = labels
  graphData.datasets = datasets

  graphGenerator.generate(graphData)
}

module.exports = topAuthorsByGameCount
