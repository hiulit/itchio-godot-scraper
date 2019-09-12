# itch.io Godot Scraper

A scraper for Godot games hosted on https://itch.io/.

## API URL

https://itchio-godot-scraper.now.sh

## Usage

- `/api` - Get all the games.
- `/api/games` - Get all the games titles.
- `/api/game/title/:title` - Get game by title.
- `/api/game/id/:id` - Get game by id.
- `/api/authors` - Get all the authors.
- `/api/author/:author` - Get games by author.
- `/api/platforms` - Get all the platforms.
- `/api/platforms/:platform` - Get games by platform.

## How does the scraper finds games

To find a specific game, the scraper uses `/api/game/:title`.

What the scrapes does is take `:title` and split in words, following some conventions (see below). Then it looks for all the games that have those words in it, and returns the one that have the more words.

For the scraper to be able find the game, the game's name/title (and particularly the game's build name) needs to follow any of these conventions:

- It must be camelCase (e.g. `thisIsMyGame`).
- It must use dashes or underscores (e.g. `this-is-my-game` or `this_is_my_game`).
- It must use spaces (e.g `this is my game`).
- It must use dots (e.g. `this.is.my.game`).

## Troubleshooting

### The scraper can't find a game

For the scraper to be able to find a game, the game's build name must follow these conventions:

- It must have the game's title in it (it may seem obvious but some game builds doesnt' match with the game's title at all).
- It must follow the above conventions.
