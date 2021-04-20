import * as Crypto from "crypto"

const randomId = (length = 10, alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") => Array.from(Array(length)).map(() => alphabet[Math.trunc(Math.random() * alphabet.length)]).join("")
const inMinutes = (mins: number) => Date.now() + (mins*60*1000)
const passed = (timestamp: number) => timestamp < Date.now()

export function Loginner<T extends { email: string, id?: string, passwordHash?: string }, TMe = {}>(_opts: {
    sendCode?: (email: string, code: string) => Promise<void>,
    newAcct?: (email: string) => T|Promise<T>,
    me?: (acct: T) => Promise<TMe>,
    hashPassword?: (raw: string) => string|Promise<string>,
} = {}) {
    // TODO produce a middleware, maybe put account in req.acct or at least req.getAcct(), maybe take a function as a continuing middleware?
    // Remember this is really going to be used by the ZipRpc middleware etc. So it can just look at req.acct or something, or pass on req?
    const opts: Required<typeof _opts> = {
        sendCode: _opts.sendCode || (async (email: string, code: string) => { if (true) console.log("Code is", code); else throw "Error: Must implement `sendCode` if there are accounts with no passwords" }),
        newAcct: async (email:string) => {
            const obj = _opts.newAcct ? await (_opts.newAcct(email)) : { email, id: undefined as string|undefined, firstName: email.split("@")[0] }
            return { ...obj, id: obj.id || randomId() } as any
        },
        me: async (acct: T) => ({ name: (acct as any).name, firstName: (acct as any).firstName, lastName: (acct as any).lastName, displayName: (acct as any).displayName } as any),
        hashPassword: (raw: string) => Crypto.createHash('sha256').update(raw).digest('hex'),
    }
    const db = { //TODO persist in and out
        users: [] as T[],
        codes: [] as {code: string, acctId: string, expiry: number}[],
        sessions: [] as {token: string, acctId: string, expiry: number}[],
    }
    let pruned = <T extends { expiry: number }>(list: T[]) => list.filter(x => !passed(x.expiry))
    const acctByEmail =  (email: string) => db.users.find(x => x.email === email)
    const acctById =  (id: string) => db.users.find(x => x.id === id)
    const verifyToken = (token: string) => {
        db.sessions = pruned(db.sessions)
        const find = db.sessions.find(x => x.token === token)
        return find ? find.acctId : null
    }
    const issueToken = (acctId: string) => {
        const token = randomId(32)
        db.sessions.push({ token, acctId, expiry: inMinutes(24*60) })
        return token
    }
    const api = {
        async useEmail(email: string) {
            let find = acctByEmail(email)
            if (!find) { // Create account
                const newAcct = await opts.newAcct(email)
                db.users.push(newAcct)
                find = newAcct
            }
            const code = randomId(6, "0123456789")
            db.codes.push({ code, acctId: find.id, expiry: inMinutes(5) })
            // TODO send code
            await opts.sendCode(email, code)
            return { type: "code_sent" }
        },
        async loginWithEmailAndPassword(email: string, password: string) {
            const passwordHash = await opts.hashPassword(password) 
            const acct = acctByEmail(email)
            if (!acct) return { error: "We don't recognize that email. Did you mean to register?" }
            if (!acct.passwordHash) return { error: "That account has no password. You must login via code, link, etc." }
            if (acct.passwordHash === passwordHash) {
                const token = issueToken(acct.id)
                return { token }
            } else {
                return { error: "Incorrect password" }
            }
        },
        async loginWithCode(code: string) {
            db.codes = pruned(db.codes)
            const find = db.codes.find(x => x.code === code)
            if (!find) return null
            find.expiry = 0 // so it cannot be used again
            const token = issueToken(find.acctId)
            return { token }
        },
        async me(token: string) {
            const acctId = verifyToken(token)
            const acct = acctId && acctById(acctId)
            const me = acct && await opts.me(acct)
            return me
        },
        logout(token: string) {
            const session = db.sessions.find(x => x.token === token)
            if (!session) return false
            db.sessions = db.sessions.filter(x => x.token !== token)
            return true
        },
    }
    return { api, verifyToken }
}