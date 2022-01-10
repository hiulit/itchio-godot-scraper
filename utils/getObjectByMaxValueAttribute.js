let getObjectByMaxValueAttribute = function (array, attribute) {
  // 'array' must be type Array
  // 'attribute' must be type String
  let max = Math.max.apply(
    Math,
    array.map(function (obj) {
      return obj[attribute]
    })
  )

  let obj = array.find(function (obj) {
    return obj[attribute] == max
  })

  return obj
}

module.exports = getObjectByMaxValueAttribute
