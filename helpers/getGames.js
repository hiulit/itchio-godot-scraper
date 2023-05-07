const fetch = require('node-fetch')
const fflate = require('fflate')

let getGames = async function (url) {
  const compressed = new Uint8Array(
    await fetch(url).then(res => res.arrayBuffer())
  )

  const decompressed = fflate.strFromU8(fflate.decompressSync(compressed))
  return JSON.parse(decompressed)
}

module.exports = getGames
