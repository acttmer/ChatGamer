# Requirements

## A complete development environment
### First thing
- Install Nodejs (Version >= 10.x)
- `npm install typescript ts-node -g`

### For Ubuntu 16.04+
`sudo apt-get update`

`sudo apt-get install python-minimal`

`sudo apt-get install build-essential`

`sudo apt-get install -yq --no-install-recommends libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 libnss3 `

### For MacOS or other Unix/Linux System
- Install Python2 first
- Please check how to deploy node-gyp and install other dependencies

### For Windows
- Install Python2 and setup node-gyp (follow documents)
- You may be good if you are lucky enough =_=

# How to run
- cd to the folder that has 'package.json'
- run `npm install`
- if there is no error, run `ts-node main.ts`
- When the qrcode shows up, scan it with your wechat
- Enjoy your game

# How to play
- Find array "admins"
- Add your wechat nickname to it
- In a group, send "看谁能够一站到底"
- When everyone joins the game, send "游戏开始"
- If you want to stop the game immediately, send "结束游戏"
- If you want to save the game data, send "dump"
- If you want to load the saved game data, send "load"
- If you want to change dataset, send "dataset:<DatasetName>", for example, `dataset:history`