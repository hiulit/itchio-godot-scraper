const fetch = require('node-fetch')

let getGame = async function (url) {
  const response = await fetch(url)
  return response.text()
}

module.exports = getGame
