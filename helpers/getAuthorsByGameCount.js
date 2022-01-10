let getAuthorsByGameCount = function (games, number) {
  let authors = []
  let authorCounts = {}
  let authorWithGameCount
  let topAuthors = []

  for (let index = 0; index < games.length; index++) {
    const game = games[index]
    authors.push(game.author)
  }

  // Count how many times each author is in the array
  // that equals to the amount of games the author has.
  authors.forEach(function (x) {
    authorCounts[x] = (authorCounts[x] || 0) + 1
  })

  // Create an array with separate objects for each author.
  authorWithGameCount = Object.keys(authorCounts).map(function (key) {
    let obj = {
      author: null,
      games: null
    }
    obj.author = key
    obj.games = authorCounts[key]
    return obj
  })

  // Sort array by number of games (DESC).
  authorWithGameCount.sort(function (a, b) {
    return parseFloat(b.games) - parseFloat(a.games)
  })

  // Return only the top X authors.
  for (let index = 0; index < number; index++) {
    const element = authorWithGameCount[index]
    topAuthors.push(element)
  }

  return topAuthors
}

module.exports = getAuthorsByGameCount
