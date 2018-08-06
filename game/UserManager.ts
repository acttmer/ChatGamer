import { DataStorage } from './DataStorage'

interface User {
    username: string,
    id: number,
    points: number
}

export class UserManager {
    public static register(username: string): void {
        DataStorage.getDataArray('users').push({
            id: DataStorage.getDataArray('users').size() + 1,
            username,
            points: 100
        })
    }

    public static leave(username: string): void {
        DataStorage.getDataArray('users').delete({ username })
    }

    public static getInfo(username: string): User {
        return DataStorage.getDataArray('users').find({ username }).first()
    }

    public static getAll(): User[] {
        return DataStorage.getDataArray('users').all()
    }

    public static exists(username: string): boolean {
        if (DataStorage.getDataArray('users').find({ username }).first()) {
            return true
        }
        return false
    }

    public static reset(): void {
        DataStorage.getDataArray('users').clear()
    }

    public static addPoint(username: string, point: number) {
        let user: User = DataStorage.getDataArray('users').find({ username }).first()
        user.points += point
        return user.points
    }
}