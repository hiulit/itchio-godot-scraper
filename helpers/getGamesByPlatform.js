let getGamesByPlatform = function (games, platform) {
  let gamesByPlatforms = []

  for (let i = 0; i < games.length; i++) {
    const game = games[i]

    if (game.platforms && game.platforms.length) {
      for (let j = 0; j < game.platforms.length; j++) {
        if (game.platforms[j].toUpperCase() === platform.toUpperCase()) {
          gamesByPlatforms.push(game)
        }
      }
    }
  }

  return gamesByPlatforms
}

module.exports = getGamesByPlatform
