const fs = require('fs')
const path = require('path')
const readJSON = require('../utils/readJSON')
const { TwitterApi } = require('twitter-api-v2')
require('dotenv').config()

let twitterBot = {
  tweet () {
    const loggedInUserName = 'GodotScraper'

    const oldJSONPath = path.resolve('all-old.json')
    const newJSONPath = path.resolve('all.json')

    let debugMode = false

    if (!fs.existsSync(oldJSONPath) || !fs.existsSync(newJSONPath)) {
      console.log(`ERROR: The following files must exists!
    
- "${oldJSONPath}"
- "${newJSONPath}"`)
      return
    }

    let oldJSON = readJSON(oldJSONPath)
    let currentJSON = readJSON(newJSONPath)

    let newGames = currentJSON.filter(a => !oldJSON.some(b => a.id === b.id))

    if (newGames.length) {
      let client

      if (!debugMode) {
        if (
          !process.env.TWITTER_API_KEY ||
          !process.env.TWITTER_API_SECRET ||
          !process.env.TWITTER_ACCESS_TOKEN ||
          !process.env.TWITTER_ACCESS_TOKEN_SECRET
        ) {
          console.log(`ERRROR: The tweeter bot needs some secret keys in ".env".\n
    - TWITTER_API_KEY
    - TWITTER_API_SECRET
    - TWITTER_ACCESS_TOKEN
    - TWITTER_ACCESS_TOKEN_SECRET`)
          return
        }

        client = new TwitterApi({
          appKey: process.env.TWITTER_API_KEY,
          appSecret: process.env.TWITTER_API_SECRET,
          accessToken: process.env.TWITTER_ACCESS_TOKEN,
          accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
        })
      }

      ;(async function () {
        if (!debugMode) {
          let meUser = await client.v2.me({ 'tweet.fields': ['id', 'text'] })

          if (meUser.data.username !== loggedInUserName && !debugMode) {
            console.log(
              `ERROR: Logged-in username ("${meUser.data.username}") must be "${loggedInUserName}"!`
            )
            return
          }
        }

        for await (let game of newGames) {
          let tweetMessage = `${game.title}${
            game.description ? ' - ' + game.description : ''
          } ${game.genre ? '#' + game.genre : ''}\n
${game.link} by ${game.author}
${game.platforms ? '\nAvailable for #' + game.platforms.join(' #') + '\n' : ''}
#ItchioGodotScraper #GodotEngine #MadeWithGodot`

          if (debugMode) {
            console.log(tweetMessage)
            console.log('----')
          } else {
            let { data: createdTweet } = await client.v2.tweet(tweetMessage)
            console.log('Tweet', createdTweet.id, '\n')
            console.log(createdTweet.text)
            console.log('----')
          }
        }
      })()
    } else {
      console.log("There aren't any new games to tweet.")
    }
  }
}

module.exports = twitterBot
