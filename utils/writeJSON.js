const fs = require('fs')
const path = require('path')

let writeJSON = function (data, filePath) {
  try {
    fs.writeFileSync(
      path.resolve(filePath) + '.json',
      JSON.stringify(data, null, 2)
    )
    console.log()
    console.log(
      '\033[1;32m"' + filePath + '.json"\033[0m has been created successfully!'
    )
    console.log()
  } catch (err) {
    console.error(err)
  }
}

module.exports = writeJSON
