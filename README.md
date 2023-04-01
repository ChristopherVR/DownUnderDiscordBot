<p align="center"> 
  <img src="https://github.com/devicons/devicon/blob/master/icons/discordjs/discordjs-plain.svg" alt="DownUnderDiscordBot" width="80px" height="80px">
</p>
<h1 align="center"> Down Under is a Discord Music player bot </h1>
<h3 align="center"> TypeScript, DiscordJS & NodeJS is used for this project. This bot was mainly created for educational reasons. </h3>  
<h4 align="center"> Note: This project is still a WIP </h4>  
</br>

<!-- TABLE OF CONTENTS -->
<h2 id="table-of-contents"> :book: Table of Contents</h2>

<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project"> ➤ About The Project</a></li>
    <li><a href="#prerequisites"> ➤ Prerequisites</a></li>
    <li><a href="#setup"> ➤ Setup</a></li>
    <li><a href="#config"> ➤ Config</a></li>
    <li><a href="#commands"> ➤ Commands</a></li>
  </ol>
</details>

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

<!-- ABOUT THE PROJECT -->
<h2 id="about-the-project"> :pencil: About The Project</h2>

<p align="justify"> 
  This project aims to create a Discord music player for personal use with friends. There may be a few "memes" in the code base. It makes use of DiscordJS npm package for communication with the Discord API.
</p>

## Features

- 🟦 Typescript
- 🔥 Slash commands
- 💪 Event & Command handlers
- ✈️ Localization
  ![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

<!-- PREREQUISITES -->
<h2 id="prerequisites"> :fork_and_knife: Prerequisites</h2>

![made-with-typescript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) <br>
![Made with-nodejs](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) <br>
[![build status][buildstatus-image]][buildstatus-url]

[buildstatus-image]: https://github.com/ChristopherVR/DownUnderDiscordBot/blob/main/.github/workflows/badge.svg
[buildstatus-url]: https://github.com/ChristopherVR/DownUnderDiscordBot/actions

<!--This project is written mainly in C# and JavaScript programming languages. <br>-->

The following open source packages are used in this project:

- <a href="https://www.typescriptlang.org/"> TypeScript</a>
- <a href="https://nodejs.org/en/"> NodeJS</a>
- <a href="https://discord.js.org/#/"> DiscordJS</a>

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

<!-- SETUP -->
<h2 id="setup"> :floppy_disk: Setup</h2>
<p> 
Clone the git repo and install dependencies using

```
npm ci
```

You can then run following scripts for local development

```
npm run build  // builds the app

npm test  // run unit tests

npm lint  // check for any linting issues

npm run dev // builds & runs the app in development mode
```

Create a file names `.env` and fill it out accordingly (see Config section).

</p>

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

<!-- ROADMAP -->
<h2 id="config"> :dart: Config</h2>

<p align="justify"> 
The following app settings needs to be configured in a .env file:

- **CLIENT_TOKEN**: The discord API token that you can setup <a href="https://discord.com/developers/docs/intro"> here</a>.
- **OPEN_AI_TOKEN**: The OpenAI token that you can setup <a href="https://openai.com/api/"> here</a>.
- **PORT**: Indicates the port the NodeJS backend server will use. Example `7235`.
- **HOST**: Indicates the host of the server. This is usually an IP address or a domain name. Example `localhost`
- **DOCKER_REGISTRY**: Indicates where the docker registry is. This is used when building and pushing docker images to. Example `127.0.0.1`
- **EXTERNAL_DNS_NAME_OR_IP**: DNS or IP address to use for docker. Example `localhost`
- **TAG**: Tag name for the docker images. Example `latest`

An example .env file would look like this:

```
CLIENT_TOKEN=SomeRandomToken
OPEN_AI_TOKEN=SomeRandomToken
PORT=3000
HOST=localhost
EXTERNAL_DNS_NAME_OR_IP=localhost
DOCKER_REGISTRY=127.0.0.1
TAG=latest
```

</p>

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

<!-- COMMANDS -->
<h2 id="commands"> 💻 Commands</h2>

<p align="justify"> 
The following slash commands are available in discord.

Example playing a track

```
/play https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

- **Ask**: Allows user to input a query for OpenAI and return the response.
- **Meme**: Generates a meme using OpenAI.
- **Back**: Go back to the previous track.
- **Clear**: Clears all the tracks in the queue.
- **Controller**: Sets the controller channel.
- **Filter**: Adds a filter to your track.
- **Jump**: Jumps to particular track in the queue.
- **Loop**: Enable or disable looping of a track, or the whole queue.
- **NowPlaying**: Shows the current playing track.
- **Pause**: Pauses the player.
- **Play**: Plays a track or playlist by providing a link or a keyword.
- **PlayNext**: Sets the track that will play next in the queue.
- **Remove**: Removes the specified track from the playlist.
- **Resume**: Resumes the paused track.
- **Save**: Saves the current track.
- **Search**: Searches for tracks on the selected provider.
- **Seek**: Set the position of the playing track.
- **Shuffle**: Shuffles the queue.
- **Skip**: Skip the first track.
- **Stop**: Stops the current track.
- **Volume**: Adjusts the player's volume.
- **Queue**: Lists the tracks in the current queue.
- **Hello**: Returns a greeting.
</p>

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)
