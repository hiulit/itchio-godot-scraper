const axios = require('axios');

let getGames = async function (url) {
  const response = await axios.get(url);
  return response.data;
}

module.exports = getGames;