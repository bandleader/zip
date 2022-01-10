import * as RPC from './rpc'
import * as Storage from './storage'

function randId() { return Math.random().toString(36).slice(2) }

export function Identity(endpoint = "/api/identity") {
    const loginTokens: Record<string/*email*/, { code: string, when: number }> = {}
    const sessionTokens: Record<string/*token*/, { email: string, when: number, ip: string }> = {}
    const users = cache(k => ({
        storage: Storage.Storage("")
    }))
    const apis = {
        loginWithEmail(email: string, code?: string) {
            email = email.toLowerCase().trim()
            const tryFind = loginTokens[email]
            if (!code || !tryFind) {
                loginTokens[email] = { code: /*'333'*/randId(), when: Date.now() }
                return { sentCode: true, message: "We've sent you a code by email. Oh BTW, it's " + loginTokens[email].code }
            } else if (tryFind.code !== code) {
                return { message: "Code is incorrect" }
            } else if (tryFind.when < Date.now() - 2*60*1000) {
                return { message: "Code expired" }
            } else {
                const token = randId()
                sessionTokens[token] = { email, when: Date.now(), ip: this.req.ip }
                return { loggedIn: true, token, session: { email } }
            }
        },
        useSessionToken(token: string) {
            const findIt = sessionTokens[token]            
            if (!findIt || findIt.when <= Date.now() - 60*60*1000) return { message: "Token not found" }
            findIt.when = Date.now() // Extend it. TODO issue new tokens...
            return { success: true, session: { email: findIt.email } }
        },
    }
    const rpc = RPC.QRPC(apis, endpoint)
    const apiHandler = (req: any, res: any) => {
        const args = req.path.slice(endpoint.length).split("/").filter(x => x)
        if (args[0] === 'session') { //api/identity/session/<TOKEN>/storage
            const findSession = apis.useSessionToken(args[1])
            if (!findSession.session) throw "Invalid session token"
            const cmd = args[2]
            if (cmd === 'storage') {
                return users.get(findSession.session.email).storage.rpc.handler(req, res)
            } else {
                throw "Invalid command " + cmd
            }
        } else {
            return rpc.handler(req, res)
        }
    }
    const script = `(function() {
        const apis = ${rpc.script}
        function observable(initialValue) {
            const handlers = []
            const subscribe = fn => { handlers.push(fn) }
            let cur = initialValue
            const tick = () => { for (const fn of handlers) try { fn(cur) } catch(e) { console.error('Error in event handler:', e) } }
            return {
                get value() { return cur },
                set value(newValue) { cur = newValue; tick() },
                tick, subscribe
            }
        }
        const session = observable(null)
        // If in localStorage verify the token
        if (localStorage.identityToken) {
            ;(async function() {
                const resp = await apis.useSessionToken(localStorage.identityToken)
                if (resp.success) setSession(resp.session)
                else localStorage.identityToken = ''
            })()
        }
        function setSession(x) {
            if (x) {
                x.storage = ${Storage.Storage("").script}
                x.storage._setEndpoint("${endpoint}/session/" + localStorage.identityToken + "/storage")
            }
            session.value = x
            return x
        }
        async function login() {
            const email = prompt('Enter your email address:')
            if (!email) return;
            const resp = await apis.loginWithEmail(email)
            if (!resp.sentCode) return alert("Error: " + resp.message)
            const code = prompt(resp.message)
            if (!code) return;
            const resp2 = await apis.loginWithEmail(email, code)
            if (!resp2.loggedIn) return alert("Error: " + resp2.message)
            localStorage.identityToken = resp2.token
            return setSession(resp2.session)
        }
        async function logout() {
            // TODO tell server
            localStorage.identityToken = ""
            setSession(null)
        }
        return { login, logout, session, apis }
    })()`
    return { script, apiHandler }
}

function cache<T>(factory: (key: string) => T) {
    const soFar: Record<string, T> = {}
    const check = (key: string) => !!soFar[key]
    const get = (key: string) => {
        if (!check(key)) soFar[key] = factory(key)
        return soFar[key]
    }
    return { get, check }
}