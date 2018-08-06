import { config, Contact, Message, Wechaty, Room } from 'wechaty'
import { generate } from 'qrcode-terminal'

import { GameRoom } from './game/GameRoom'
import { UserManager } from './game/UserManager'
import { Ranking } from './game/Ranking'
import { DataStorage } from './game/DataStorage'

const bot = new Wechaty({
    profile: config.default.DEFAULT_PROFILE,
})

bot
    .on('logout', onLogout)
    .on('login', onLogin)
    .on('scan', onScan)
    .on('error', onError)
    .on('message', onMessage)
    .on('heartbeat', onHeartbeat)

bot.start().catch(async e => {
    console.error('Bot start() fail:', e)
    await bot.stop()
    process.exit(-1)
})

function onScan(qrcode: string, status: number) {
    generate(qrcode, { small: true })

    const qrcodeImageUrl = [
        'https://api.qrserver.com/v1/create-qr-code/?data=',
        encodeURIComponent(qrcode),
    ].join('')

    console.log(`[${status}] ${qrcodeImageUrl}\nScan QR Code above to log in: `)
}

function onLogin(user: Contact) {
    console.log(`${user.name()} logined`)
}

function onLogout(user: Contact) {
    console.log(`${user.name()} logouted`)
}

function onError(e: Error) {
    console.error('Bot error:', e)
}

function _T(text: string) {
    return '■□ ' + text
}

async function onMessage(msg: Message) {
    if (
        GameRoom.currentRoomTopic != 'NULL' && 
        (
            !msg.room() ||
            await (msg.room() as Room).topic() != GameRoom.currentRoomTopic
        )
    ) {
        return
    }

    if (!msg.text() || msg.text().trim().length == 0) {
        return
    }

    if (msg.text().indexOf(_T('')) == 0) {
        return
    }

    if (!msg.room()) {
        return
    }

    /* Set default admin nicknames */
    let admins = ['YourWechatNickname']

    /* Use wechat nickname or weixin number as username */
    let username = (msg.from() as Contact).name()

    if (username == '') {
        username = (msg.from() as Contact).weixin() as string
    }

    /* Enable Anti-Flood System */
    if (
        GameRoom.antiFloodMap[username] && 
        Date.now() - GameRoom.antiFloodMap[username] <= 1000
    ) {
        console.log('[ANTI FLOOD] ' + msg.text())
        return
    }

    GameRoom.antiFloodMap[username] = Date.now()

    console.log(`${username}: ${msg.text()}`)

    /* Commands before setting game room */
    if (msg.text() == '看谁能够一站到底' && admins.indexOf(username) >= 0 && GameRoom.currentRoomTopic == 'NULL') {
        GameRoom.currentRoomTopic = await (msg.room() as Room).topic()
        /* Load default dataset */
        GameRoom.loadDataset('computer_fdt')
        
        await msg.say(_T(
            `
欢迎来到 TechX 一站到底，让我来简单介绍一下操作方式吧！

== 当前可输入指令 ==
我要玩 => 加入游戏
我不玩了 => 退出游戏
有谁在玩 => 查看当前玩家列表

== 游戏玩法 ==
当所有玩家就绪后，由管理员宣布游戏开始。
每隔 20 秒，ChatGamer 会发送一道简单的选择题到群内，届时所有玩家将输入自认为正确的选项序号以抢答。
最先答对的玩家获得 20 积分奖励，所有答错的玩家扣除 10 积分，没有回答的玩家扣除 5 积分。
每位玩家在加入游戏后获得 100 初始积分，当积分 <= 0 时，该玩家出局。`
        ))
    }


    if (GameRoom.gameIsStarted) {
        /* Commands after starting the game */
        if (!GameRoom.allowToAnswer) {
            return
        }

        if (/^\+?(0|[1-9]\d*)$/.test(msg.text()) && UserManager.exists(username)) {
            if (GameRoom.answeredPlayers.find(answeredPayer => answeredPayer.username == username)) {
                return
            }

            let ansIndex = parseInt(msg.text()) - 1
            if (ansIndex < GameRoom.lastQuestion.choices.length && ansIndex >= 0) {
                if (GameRoom.lastQuestion.choices[ansIndex] == GameRoom.lastQuestion.correct_choice) {
                    GameRoom.answeredPlayers.push({
                        username,
                        isCorrect: true
                    })
                } else {
                    GameRoom.answeredPlayers.push({
                        username,
                        isCorrect: false
                    })
                }
            }
        }
        else if (
            msg.text() == '我不玩了' && 
            UserManager.exists(username) &&
            !GameRoom.answeredPlayers.find(answeredPayer => answeredPayer.username == username)
        ) {
            UserManager.leave(username)
            await msg.say(_T(`${username} 退出了游戏！`))
        }
        else if (msg.text() == 'dump' && admins.indexOf(username) >= 0) {
            DataStorage.dump()
            await msg.say(_T('数据储存成功'))
        }
        else if (msg.text() == '结束游戏' && admins.indexOf(username) >= 0) {
            await msg.say(_T('管理员结束了游戏'))
            UserManager.reset()
            GameRoom.gameIsStarted = false
            GameRoom.currentRoomTopic = 'NULL'
            GameRoom.allowToAnswer = false
            GameRoom.answeredPlayers = []
        }
    } else if (GameRoom.currentRoomTopic != 'NULL') {
        /* Commands before starting the game */
        if (msg.text() == '我要玩' && UserManager.exists(username) == false) {
            UserManager.register(username)
            await msg.say(_T(`欢迎 ${username} 加入游戏！`))
        }
        else if (msg.text() == '我不玩了' && UserManager.exists(username)) {
            UserManager.leave(username)
            await msg.say(_T(`${username} 退出了游戏！`))
        }
        else if (msg.text() == '有谁在玩' && UserManager.exists(username)) {
            const users = UserManager.getAll()
            const usernames = []
            for (let user of users) {
                usernames.push(user.username)
            }
            await msg.say(_T(`参与玩家：${usernames.join(', ')}`))
        }
        if (msg.text() == 'dump' && admins.indexOf(username) >= 0) {
            DataStorage.dump()
            await msg.say(_T('数据储存成功'))
        }
        else if (msg.text() == 'load' && admins.indexOf(username) >= 0) {
            DataStorage.load()
            await msg.say(_T('数据加载成功'))
            let users = Ranking.generateRanking()
            let rankingString = ''
            for (let i = 0; i < users.length; i++) {
                rankingString += `[${(i + 1)}] ${users[i].username} ${users[i].points}\n`
            }
            await msg.say(_T(
`
== 初始积分排行榜 ==
${rankingString.trim()}`
            ))
            
        }
        else if (msg.text() == 'dump' && admins.indexOf(username) >= 0) {
            DataStorage.dump()
            await msg.say(_T('数据储存成功'))
        }
        else if (msg.text() == '游戏开始' && admins.indexOf(username) >= 0) {
            await msg.say(_T('游戏现在开始'))
            GameRoom.msgHandle = msg
            GameRoom.gameIsStarted = true
        }
        else if (msg.text() == '结束游戏' && admins.indexOf(username) >= 0) {
            await msg.say(_T('管理员结束了游戏'))
            UserManager.reset()
            GameRoom.gameIsStarted = false
            GameRoom.currentRoomTopic = 'NULL'
            GameRoom.allowToAnswer = false
            GameRoom.answeredPlayers = []
        }
        else if (msg.text().indexOf('dataset:') >= 0 && admins.indexOf(username) >= 0) {
            let datasetName = msg.text().substr(msg.text().indexOf('dataset:') + 8)
            GameRoom.loadDataset(datasetName)
            await msg.say(_T(`本轮游戏将使用 ${datasetName} 数据集`))
        }
    }
}

async function onHeartbeat() {
    if (!GameRoom.gameIsStarted || GameRoom.allowToAnswer) {
        return
    }

    let question = GameRoom.getRandomQuestion()
    let title = question.title.replace(/\n/g, '').trim()
    let choiceString = ''

    for (let i = 0; i < question.choices.length; i++) {
        choiceString += `[${(i + 1)}] ${question.choices[i].replace(/\n/g, '').trim()}\n`
    }
    await GameRoom.msgHandle.say(_T(
`
== 题目 ==
${title}

== 选项 ==
${choiceString.trim()}`
    ))

    GameRoom.allowToAnswer = true

    /* Handler for answering period */
    setTimeout(async () => {
        if (!GameRoom.gameIsStarted) {
            return
        }

        /* Stats of game result */
        let koPlayerNames: string[] = []
        let winPlayerNames: string[] = []
        let wrongPlayerNames: string[] = []

        let allPlayers = UserManager.getAll()
        for (let player of allPlayers) {
            if (!GameRoom.answeredPlayers.find(answeredPayer => answeredPayer.username == player.username)) {
                let leftPoints = UserManager.addPoint(player.username, -5)
                if (leftPoints <= 0) {
                    koPlayerNames.push(player.username)
                    UserManager.leave(player.username)
                }
            }
        }

        for (let answeredPlayer of GameRoom.answeredPlayers) {
            if (answeredPlayer.isCorrect) {
                winPlayerNames.push(answeredPlayer.username)
            } else {
                wrongPlayerNames.push(answeredPlayer.username)
                let leftPoints = UserManager.addPoint(answeredPlayer.username, -10)
                if (leftPoints <= 0) {
                    koPlayerNames.push(answeredPlayer.username)
                    UserManager.leave(answeredPlayer.username)
                }
            }
        }

        if (winPlayerNames.length > 0) {
            UserManager.addPoint(winPlayerNames[0], 20)
        }

        let responseText = ''
        if (winPlayerNames.length > 0) {
            responseText += `首位答对玩家：${winPlayerNames[0]}\n\n`
        }
        if (wrongPlayerNames.length > 0) {
            responseText += `答错玩家：${wrongPlayerNames.join(', ')}\n\n`
        }
        if (koPlayerNames.length > 0) {
            responseText += `出局玩家：${koPlayerNames.join(', ')}\n\n`
        }

        let users = Ranking.generateRanking()
        let rankingString = ''
        for (let i = 0; i < users.length; i++) {
            rankingString += `[${(i + 1)}] ${users[i].username} ${users[i].points}\n`
        }
        await GameRoom.msgHandle.say(_T(
`
== 本轮结果 ==
${responseText.trim()}

== 积分排行榜 ==
${rankingString.trim()}`
        ))

        GameRoom.allowToAnswer = false
        GameRoom.answeredPlayers = []

        if (UserManager.getAll().length == 0) {
            await GameRoom.msgHandle.say(_T('所有玩家出局，游戏结束'))
            GameRoom.gameIsStarted = false
            GameRoom.currentRoomTopic = 'NULL'
        }
        else if (UserManager.getAll().length == 1) {
            await GameRoom.msgHandle.say(_T(`${UserManager.getAll()[0].username} 提前获得胜利！`))
        }
    }, 20000)
}