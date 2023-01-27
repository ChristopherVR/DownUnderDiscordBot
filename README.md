<p align="center"> 
  <img src="NeinDiscordBot/public/logo512.png" alt="NeinDiscordBot" width="80px" height="80px">
</p>
<h1 align="center"> NeinDiscordBot is a Discord Music player bot </h1>
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
  </ol>
</details>

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

<!-- ABOUT THE PROJECT -->
<h2 id="about-the-project"> :pencil: About The Project</h2>

<p align="justify"> 
  This project aims to create a Discord music player for personal use with friends. There may be a few "memes" in the code base. It makes use of DiscordJS npm package for communication with the Discord API.
</p>

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

<!-- PREREQUISITES -->
<h2 id="prerequisites"> :fork_and_knife: Prerequisites</h2>

![made-with-typescript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) <br>
![Made with-nodejs](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) <br>
[![build status][buildstatus-image]][buildstatus-url]

[buildstatus-image]: https://github.com/ChristopherVR/NeinDiscordBot/blob/main/.github/workflows/badge.svg
[buildstatus-url]: https://github.com/ChristopherVR/NeinDiscordBot/actions

<!--This project is written mainly in C# and JavaScript programming languages. <br>-->
The following open source packages are used in this project:
* <a href="https://www.typescriptlang.org/"> TypeScript</a> 
* <a href="https://nodejs.org/en/"> NodeJS</a> 
* <a href="https://discord.js.org/#/"> DiscordJS</a> 
 
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

</p>

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

<!-- ROADMAP -->
<h2 id="config"> :dart: Config</h2>

<p align="justify"> 
The following app settings needs to be configured in a .env file:

* **CLIENT_TOKEN**: The discord API token that you can setup <a href="https://discord.com/developers/docs/intro"> here</a>.
* **OPEN_AI_TOKEN**: The OpenAI token that you can setup  <a href="https://openai.com/api/"> here</a>.
* **PORT**: Indicates the port the NodeJS backend server will use. Example `7235`.
* **HOST**: Indicates the host of the server. This is usually an IP address or a domain name. Example `localhost`

An example .env file would look like this:
```
CLIENT_TOKEN=SomeRandomToken
OPEN_AI_TOKEN=SomeRandomToken
PORT=3000
HOST=localhost
```
</p>

![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png)

