const axios = require("axios");
const axiosRetry = require("axios-retry").default;
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const client = axios.create();

axiosRetry(client, {
  retries: 5,
  retryDelay: (retryCount, error) => {
    const delay = Math.min(axiosRetry.exponentialDelay(retryCount), 60000);

    if (error.response && error.response.status === 429) {
      console.log(
        `\nRate limited (429). Retry ${retryCount}/5. Waiting ${Math.round(
          delay / 1000
        )} seconds...`
      );
      return delay;
    }

    console.log(
      `\nRetrying request (${retryCount}/5). Waiting ${Math.round(
        delay / 1000
      )} seconds...`
    );
    return delay;
  },
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response && error.response.status === 429)
    );
  },
});

const http = require("http");
const https = require("https");
http.globalAgent.maxSockets = 1;
https.globalAgent.maxSockets = 1;

let baseURL = "https://itch.io/games/";
let scrapeURLS = ["made-with-godot", "tag-godot"];

let allResults = [];

const logSameLine = (message) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(message);
};

const scrapePage = async (scrapeURL, pageNumber) => {
  const url = `${baseURL}${scrapeURL}?page=${pageNumber}`;
  try {
    logSameLine(`Scraping page ${pageNumber}...`);

    const { data } = await client.get(url);
    const $ = cheerio.load(data);

    let results = [];

    if ($(".game_cell").length) {
      $(".game_cell").each(function (i, elem) {
        let game = {};

        game.author =
          $(elem).find(".game_cell_data .game_author").text().trim() || null;
        game.description =
          $(elem).find(".game_cell_data .game_text").text().trim() || null;
        game.genre =
          $(elem).find(".game_cell_data .game_genre").text().trim() || null;
        game.id = $(elem).attr("data-game_id") || null;
        game.link =
          $(elem)
            .find(".game_cell_data .game_title .title.game_link")
            .attr("href") || null;

        let platforms = [];
        $(elem)
          .find(".game_cell_data .game_platform")
          .children()
          .each(function (i, elem) {
            let platform = $(elem).attr("title");
            if (platform) {
              platform = platform.replace("Download for ", "");
              platforms.push(platform);
            }
            if ($(elem).hasClass("web_flag")) {
              platforms.push("HTML5");
            }
          });
        game.platforms = platforms.length ? platforms : null;

        game.thumb =
          $(elem).find(".game_thumb img").attr("data-lazy_src") || null;
        game.title =
          $(elem)
            .find(".game_cell_data .game_title .title.game_link")
            .text()
            .trim() || null;
        game.video =
          $(elem).find(".game_thumb .gif_overlay").attr("data-gif") || null;

        let scrapeWords = game.title ? game.title : "";
        scrapeWords = scrapeWords
          .replace(/[&\/\\#,+()$~%.'":*!¡?¿<>{}@]/g, "")
          .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
          .replace(/demo/gi, "")
          .split(" ")
          .filter((el) => el !== "-" && el !== "_")
          .filter((el) => el === 0 || Boolean(el));
        game.scrapeWords = scrapeWords.length ? scrapeWords : null;

        results.push(game);
      });

      return results;
    } else {
      console.log(`\nNo results found for ${scrapeURL} on page ${pageNumber}`);
      return [];
    }
  } catch (error) {
    console.error(`\nError scraping page ${pageNumber}: ${error.message}.`);
    throw error;
  }
};

const scrapeAllPages = async (scrapeURL) => {
  let currentPage = 1;
  let consecutiveEmptyPages = 0;
  const MAX_EMPTY_PAGES = 3;

  console.log(`\nScraping ${baseURL}${scrapeURL}...`);
  let totalResults = 0;

  while (true) {
    try {
      const pageResults = await scrapePage(scrapeURL, currentPage);
      totalResults += pageResults.length;

      if (pageResults.length === 0) {
        consecutiveEmptyPages++;
        if (consecutiveEmptyPages >= MAX_EMPTY_PAGES) {
          console.log(
            `\nReached ${MAX_EMPTY_PAGES} consecutive empty pages for ${scrapeURL}. Stopping.`
          );
          break;
        }
      } else {
        allResults = [...allResults, ...pageResults];
        consecutiveEmptyPages = 0;
      }

      currentPage++;

      const pageDelay = 3000 + Math.random() * 2000; // 3-5 seconds.
      await new Promise((resolve) => setTimeout(resolve, pageDelay));
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(
          `Page ${currentPage} not found for ${baseURL}${scrapeURL}. Stopping.`
        );
      } else {
        console.error(
          `\nError fetching page ${currentPage} for ${baseURL}${scrapeURL}: ${error.message}.`
        );
      }
      break;
    }
  }

  console.log(
    `Finished scraping ${baseURL}${scrapeURL}. Found ${totalResults} games.`
  );
};

const processFinalResults = () => {
  console.log("\nProcessing games...");
  console.log(`Before deduplication: ${allResults.length} total games`);

  const uniqueGames = new Map();

  for (const game of allResults) {
    if (game.id) {
      uniqueGames.set(game.id, game);
    }
  }

  let uniqueResults = Array.from(uniqueGames.values());

  const duplicatesRemoved = allResults.length - uniqueResults.length;

  console.log(
    `Removed ${duplicatesRemoved} duplicates (${(
      (duplicatesRemoved / allResults.length) *
      100
    ).toFixed(2)}% of total)`
  );
  console.log(`After deduplication: ${uniqueResults.length} unique games`);

  uniqueResults.sort((a, b) => {
    const idA = parseInt(a.id);
    const idB = parseInt(b.id);
    return idA - idB;
  });

  console.log(`Results sorted by ID in ascending order`);

  return uniqueResults;
};

const main = async () => {
  if (fs.existsSync(path.resolve("all.json"))) {
    fs.copyFileSync(path.resolve("all.json"), path.resolve("all-old.json"));
  }

  console.log("Scraping started...");

  for (const scrapeURL of scrapeURLS) {
    await scrapeAllPages(scrapeURL);
  }

  console.log(
    `\nRaw scraping complete. Found ${allResults.length} total games.`
  );

  const finalResults = processFinalResults();

  fs.writeFileSync(
    path.resolve("all.json"),
    JSON.stringify(finalResults, null, 2)
  );
  console.log(
    `\nScraping complete. Saved ${finalResults.length} unique games to all.json`
  );
};

main().catch((err) => {
  console.error("\nAn error occurred:", err);
});
