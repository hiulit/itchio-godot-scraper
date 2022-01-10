let getGamesByAuthor = function (games, author) {
  let gamesByAuthor = []

  for (let i = 0; i < games.length; i++) {
    const game = games[i]

    if (game.author.toUpperCase() === author.toUpperCase()) {
      gamesByAuthor.push(game)
    }
  }

  return gamesByAuthor
}

module.exports = getGamesByAuthor
