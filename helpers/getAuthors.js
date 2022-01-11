let getAuthors = function (games) {
  let authors = []

  for (let i = 0; i < games.length; i++) {
    const game = games[i]

    if (!authors.includes(game.author)) {
      authors.push(game.author)
    }
  }

  return authors
}

module.exports = getAuthors
