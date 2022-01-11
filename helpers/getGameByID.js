let getGameByID = function (games, id) {
  let gameByID

  for (let i = 0; i < games.length; i++) {
    const game = games[i]

    if (game.id === id) {
      gameByID = game
      break
    }
  }

  return gameByID
}

module.exports = getGameByID
