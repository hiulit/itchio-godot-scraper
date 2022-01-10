const fetch = require('node-fetch')

let getGames = async function (url) {
  const response = await fetch(url)
  return response.json()
}

module.exports = getGames
