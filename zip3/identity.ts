import * as RPC from './rpc'

function randId() { return Math.random().toString(36).slice(2) }

export function Identity() {
    const loginTokens: Record<string/*email*/, { code: string, when: number }> = {}
    const sessionTokens: Record<string/*token*/, { email: string, when: number, ip: string }> = {}
    const apis = {
        loginWithEmail(email: string, code?: string) {
            email = email.toLowerCase().trim()
            const tryFind = loginTokens[email]
            console.log(email,code,tryFind)
            if (!code || !tryFind) {
                loginTokens[email] = { code: randId(), when: Date.now() }
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
    const apiHandler = RPC.QRPC(apis, '/api/identity')
    const script = `(function() {
        const apis = ${apiHandler.script}
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
                if (resp.success) session.value = resp.session
                else localStorage.identityToken = ''
            })()
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
            session.value = resp2.session
            return resp2.session
        }
        async function logout() {
            // TODO tell server
            localStorage.identityToken = ""
            session.value = null
            return null
        }
        return { login, logout, session, apis }
    })()`
    return { script, apiHandler }
}