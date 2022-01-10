import fetch from 'node-fetch'
import * as RPC from './rpc'

export class BackendServices {
    handler() {
        let lastReq: any = null
        const analyticsUsers: Record<string, {userAgent: string, deviceId: string, lastSeen: number, lastUrl: string, ipInfo: any}> = {}
        const ipInfo: Record<string, any> = {}
        const analyticsRpc = RPC.QRPC({
            async hey(tabId: string, deviceId: string, userAgent: string, lastUrl: string) {
                analyticsUsers[tabId] = analyticsUsers[tabId] || {} as any
                analyticsUsers[tabId].userAgent = userAgent
                analyticsUsers[tabId].deviceId = deviceId
                analyticsUsers[tabId].lastSeen = Date.now()
                analyticsUsers[tabId].lastUrl = lastUrl
                const ip = lastReq.ip
                if (!ipInfo[ip]) ipInfo[ip] = await (await fetch(`https://ipwhois.app/json/${ip.includes('::')?'':ip}`, {})).json() // await (await fetch(`http://db.ou.org/geoip/${ip}`, {})).json()
                analyticsUsers[tabId].ipInfo = ipInfo[lastReq.ip]
            },
            get() { 
                return analyticsUsers 
            }
        }, "/api/analytics")
        
        const storage: Record<string, string> = {}
        const storageRpc = RPC.QRPC({
            getItem(key: string) { return storage[key] },
            setItem(key: string, value: string) { storage[key] = value; return true }
        }, "/api/storage")
        const handler = async (req: any, res: any) => {
            lastReq = req
            if (req.params?.section === 'storage') return storageRpc.handler(req, res)
            if (req.params?.section === 'analytics') return analyticsRpc.handler(req, res)
            if (req.query.expose || req.query.callback) return await RPC.handlerForJsObj(`
                window.API = ${storageRpc.script}
                window.Analytics = ${analyticsRpc.script}
                const randId = () => (Math.random() + 1).toString(36).substring(7)
                const tabId = randId()
                localStorage.deviceId = localStorage.deviceId || randId()
                async function sayHey() {
                    await window.Analytics.hey(tabId, localStorage.deviceId, navigator.userAgent, location.pathname + location.search + location.hash)
                    await window.Analytics.get()
                }
                sayHey()
                setInterval(sayHey, 5000)
            `)(req, res)
            throw "Invalid URL: " + req.path
        }
        return handler
    }
}
