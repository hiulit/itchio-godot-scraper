let getGamesTitles = function (games) {
  let titles = []

  for (let i = 0; i < games.length; i++) {
    const game = games[i]

    if (!titles.includes(game.title)) {
      titles.push(game.title)
    }
  }

  return titles
}

module.exports = getGamesTitles
