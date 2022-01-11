const Jimp = require('jimp')
// const fs = require('fs')
// const fsPromises = fs.promises
const { ChartJSNodeCanvas } = require('chartjs-node-canvas')
// const ChartDataLabels = require('chartjs-plugin-datalabels')

const palette = [
  '#e60049',
  '#0bb4ff',
  '#50e991',
  '#e6d800',
  '#9b19f5',
  '#ffa300',
  '#dc0ab4',
  '#b3d4ff',
  '#00bfa0'
]

function convertToRGB (hex) {
  if (hex.charAt(0) === '#') {
    hex = hex.replace('#', '')
  }

  let aRgbHex = hex.match(/.{1,2}/g)
  let aRgb = [
    parseInt(aRgbHex[0], 16),
    parseInt(aRgbHex[1], 16),
    parseInt(aRgbHex[2], 16)
  ]

  return aRgb.join(',')
}

function setColors (opacity = 1) {
  let colors = []

  for (let index = 0; index < palette.length; index++) {
    const color = palette[index]
    colors.push(`rgba(${convertToRGB(color)},${opacity})`)
  }

  return colors
}

let graphGenerator = {
  generate (data) {
    ;(async () => {
      const width = 400
      const height = 400

      const configuration = {
        type: data.type,
        data: {
          labels: data.labels,
          datasets: [
            {
              label: '',
              data: data.datasets,
              backgroundColor: setColors(0.6),
              borderColor: setColors(),
              borderWidth: 1
            }
          ]
        },
        options: {
          layout: {
            padding: 10
          },
          plugins: {
            title: {
              display: true,
              text: data.title
            },
            legend: data.showLegend,
            datalabels: {
              anchor: data.labelsAnchor,
              align: 'top',
              formatter: Math.round,
              font: {
                size: 10,
                weight: 400
              }
            }
          }
        },
        plugins: [
          {
            id: 'background-colour',
            beforeDraw: chart => {
              const ctx = chart.ctx
              ctx.save()
              ctx.fillStyle = 'white'
              ctx.fillRect(0, 0, width, height)
              ctx.restore()
            }
          }
        ]
      }

      const chartCallback = ChartJS => {
        ChartJS.defaults.devicePixelRatio = 2
        ChartJS.defaults.backgroundColor = 'white'
        ChartJS.defaults.color = 'black'
        ChartJS.defaults.font.family = 'Arial, sans-serif'
        ChartJS.defaults.font.weight = 400
        // ChartJS.defaults.font.size = 16
        // ChartJS.defaults.responsive = true
        // ChartJS.defaults.maintainAspectRatio = false
        ChartJS.register(require('chartjs-plugin-datalabels'))
      }

      const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width,
        height,
        chartCallback
      })

      const buffer = await chartJSNodeCanvas.renderToBuffer(configuration)
      // const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration)
      // const stream = chartJSNodeCanvas.renderToStream(configuration)

      // await fsPromises.writeFile(
      //   `./graphs-images/${data.name}.jpg`,
      //   buffer,
      //   'base64'
      // )
      Jimp.read(buffer, (err, res) => {
        if (err) throw new Error(err)
        res.resize(width, height).write(`./graph-images/${data.name}.jpg`)
      })

      console.log(`Graph "${data.name}" has been generated successfully!`)
    })()
  }
}

module.exports = graphGenerator
