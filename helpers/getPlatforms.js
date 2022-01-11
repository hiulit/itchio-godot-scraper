let getPlatforms = function (games) {
  let platforms = []

  for (let i = 0; i < games.length; i++) {
    const game = games[i]

    if (game.platforms && game.platforms.length) {
      for (let j = 0; j < game.platforms.length; j++) {
        const platform = game.platforms[j]

        if (!platforms.includes(platform)) {
          platforms.push(platform)
        }
      }
    }
  }

  return platforms
}

module.exports = getPlatforms
