const randomId = (length = 10, alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") => Array.from(Array(length)).map(() => alphabet[Math.trunc(Math.random() * alphabet.length)]).join("")
const inMinutes = (mins: number) => Date.now() + (mins*60*1000)
const passed = (timestamp: number) => timestamp < Date.now()

type LoginnerOptions<T> = {
    sendCode: (acct: T, code: string) => void
}

function Loginner<T>(sendCode: (email: string, code: string)=>Promise<void>) {
    const db = { //TODO persist in and out
        users: [] as T[],
        codes: [] as {code: string, acctId: string, expiry: number}[],
        sessions: [] as {token: string, acctId: string, expiry: number}[]
    }
    let pruned = <T extends { expiry: number }>(list: T[]) => list.filter(x => !passed(x.expiry))
    const acctByEmail =  (email: string) => db.sessions.find(x => x.email === email)
    const verifyToken = (token: string) => {
        db.sessions = pruned(db.sessions)
        const find = db.sessions.find(x => x.token === token)
        return find ? find.acctId : null
    }
    const api = {
        async useEmail(email: string) {
            const find = acctByEmail(email)
            if (!find) return null
            const code = randomId(10, "0123456789")
            db.codes.push({ code, acctId: find.id, expiry: inMinutes(5) })
            // TODO send code
            await sendCode(email, code)
            return { type: "code_sent" }
        },
        async loginWithCode(code: string) {
            db.codes = pruned(db.codes)
            const find = db.codes.find(x => x.code === code)
            if (!find) return null
            find.expiry = 0 // so it cannot be used again
            const token = randomId(32), acctId = find.acctId  
            db.sessions.push({ token, acctId, expiry: inMinutes(24*60) })
            return { token, acctId }
        }
    }
    return { api, verifyToken }
}

}