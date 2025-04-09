const axios = require('axios');

let getGame = async function (url) {
  const response = await axios.get(url);
  return response.data;
}

module.exports = getGame;
