import { UserManager } from "./UserManager";
import { DataStorage } from "./DataStorage";

export class Ranking {
    public static generateRanking() {
        let users = UserManager.getAll()
        users.sort((a, b) => b.points - a.points)
        return users
    }
}