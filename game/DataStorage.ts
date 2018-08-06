import fs from 'fs'

class DataArrayQuery {
    private filteredItems: Array<any> = []

    constructor(items: Array<any>, conditions: any) {
        for (let item of items) {
            let isEqual = true
            for (let k in conditions) {
                if (item[k] != conditions[k]) {
                    isEqual = false
                    break
                }
            }
            if (isEqual) {
                this.filteredItems.push(item)
            }
        }
    }

    public all(): Array<any> {
        return this.filteredItems
    }

    public first(): any {
        if (this.filteredItems.length > 0) {
            return this.filteredItems[0]
        }
        return null
    }

    public last(): any {
        if (this.filteredItems.length > 0) {
            return this.filteredItems[this.filteredItems.length - 1]
        }
        return null
    }

    public size(): number {
        return this.filteredItems.length
    }
}

class DataArray {
    private items: Array<any> = []

    public all(): Array<any> {
        return this.items
    }

    public first(): any {
        if (this.items.length > 0) {
            return this.items[0]
        }
        return null
    }

    public last(): any {
        if (this.items.length > 0) {
            return this.items[this.items.length - 1]
        }
        return null
    }

    public push(item: any): void {
        this.items.push(item)
    }

    public pop(): any {
        return this.items.pop()
    }

    public clear(): void {
        this.items = []
    }

    public write(items: any[]) {
        this.items = items
    }

    public size(): number {
        return this.items.length
    }

    public find(conditions: any): DataArrayQuery {
        return new DataArrayQuery(this.items, conditions)
    }

    public update(conditions: any, data: any) {
        for (let i = 0; i < this.items.length; i++) {
            let isEqual = true
            for (let k in conditions) {
                if (this.items[i][k] != conditions[k]) {
                    isEqual = false
                    break
                }
            }
            if (isEqual) {
                for (let k in data) {
                    this.items[i][k] = data[k]
                }
            }
        }
    }

    public delete(conditions: any): void {
        for (let i = 0; i < this.items.length; i++) {
            let isEqual = true
            for (let k in conditions) {
                if (this.items[i][k] != conditions[k]) {
                    isEqual = false
                    break
                }
            }
            if (isEqual) {
                this.items.splice(i, 1)
            }
        }
    }
}

export class DataStorage {
    public static data: any = {}

    public static set(key: string, value: any): void {
        this.data[key] = value
    }

    public static get(key: string): any {
        return this.data[key]
    }

    public static getDataArray(key: string): DataArray {
        if (this.data[key] instanceof DataArray) {
            return this.data[key]
        } else {
            this.data[key] = new DataArray
            return this.data[key]
        }
    }

    public static dump() {
        fs.writeFileSync(__dirname + '/../cache/dump.json', JSON.stringify(this.data), 'utf-8')
        console.log('Dump file has been created')
    }

    public static load() {
        const dumpObject = JSON.parse(fs.readFileSync(__dirname + '/../cache/dump.json', 'utf-8'))
        for (let k in dumpObject) {
            if (dumpObject[k].items) {
                this.data[k] = new DataArray;
                this.data[k].write(dumpObject[k].items)
            } else {
                this.data[k] = dumpObject[k]
            }
        }
    }
}