import * as RPC from './rpc'
import fetch from 'node-fetch'

export function Analytics() {
    const users: Record<string, {userAgent: string, deviceId: string, lastSeen: number, lastUrl: string, ipInfo: any}> = {}
    const ipInfo: Record<string, any> = {}
    const rpc = RPC.QRPC({
        async hey(tabId: string, deviceId: string, userAgent: string, lastUrl: string) {
            users[tabId] = users[tabId] || {} as any
            users[tabId].userAgent = userAgent
            users[tabId].deviceId = deviceId
            users[tabId].lastSeen = Date.now()
            users[tabId].lastUrl = lastUrl
            const ip = this.req.ip
            if (!ipInfo[ip]) ipInfo[ip] = await (await fetch(`https://ipwhois.app/json/${ip.includes('::')?'':ip}`, {})).json() // await (await fetch(`http://db.ou.org/geoip/${ip}`, {})).json()
            users[tabId].ipInfo = ipInfo[this.req.ip]
        },
        get() { 
            return users 
        }
    }, "/api/analytics")
    const script = `(function() {
        const apis = ${rpc.script}
        const randId = () => (Math.random() + 1).toString(36).substring(7)
        const tabId = randId()
        localStorage.deviceId = localStorage.deviceId || randId()
        async function sayHey() {
            await apis.hey(tabId, localStorage.deviceId, navigator.userAgent, location.pathname + location.search + location.hash)
        }
        sayHey()
        setInterval(sayHey, 5000)
        return { apis }
    })()`
    return { script, rpc }
}