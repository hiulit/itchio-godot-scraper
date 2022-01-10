const fs = require('fs')
const path = require('path')

let mkdir = function (filePath) {
  if (!fs.existsSync(path.resolve(filePath))) {
    fs.mkdirSync(path.resolve(filePath))
  }
}

module.exports = mkdir
