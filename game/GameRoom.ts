import { Message } from 'wechaty'

interface Question {
    title: string,
    choices: string[],
    correct_choice: string
}

interface AnsweredPlayer {
    username: string,
    isCorrect: boolean
}

export class GameRoom {
    public static currentRoomTopic: string = 'NULL'
    public static gameIsStarted: boolean = false
    public static lastQuestion: Question
    public static allowToAnswer: boolean = false
    public static answeredPlayers: Array<AnsweredPlayer> = []
    public static antiFloodMap: any = {}
    public static msgHandle: Message

    public static questions: Question[] = []

    public static getRandomQuestion(): Question {
        let index = Math.floor(Math.random() * this.questions.length)
        let question = this.questions[index]
        this.lastQuestion = question
        return question
    }

    public static loadDataset(name: string): void {
        this.questions = require('../dataset/' + name + '.json')
        console.log(`Use dataset '${name}'`)
    }
}