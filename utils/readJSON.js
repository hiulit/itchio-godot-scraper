const fs = require('fs')
const path = require('path')

let readJSON = function (filePath) {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'))
  } catch (err) {
    console.error(err)
    return false
  }
}

module.exports = readJSON
