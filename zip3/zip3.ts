import fetch from 'node-fetch'

export class BackendServices {
    handler() {
        let lastReq: any = null
        const analyticsUsers: Record<string, {userAgent: string, deviceId: string, lastSeen: number, lastUrl: string, ipInfo: any}> = {}
        const ipInfo: Record<string, any> = {}
        const analyticsRpc = QRPC({
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
        const storageRpc = QRPC({
            getItem(key: string) { return storage[key] },
            setItem(key: string, value: string) { storage[key] = value; return true }
        }, "/api/storage")
        const handler = async (req: any, res: any) => {
            lastReq = req
            if (req.params?.section === 'storage') return storageRpc.handler(req, res)
            if (req.params?.section === 'analytics') return analyticsRpc.handler(req, res)
            if (req.query.expose || req.query.callback) return await handlerForJsObj(`
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

function handlerForJsObj(script: string) {
    return async (req: any, res: any) => {
        if (req.query.expose) {
            res.send(`window.${req.query.expose} = ${script}`)
        } else if (req.query.callback) {
            res.send(`${req.query.callback}(${script})`)
        } else {
            throw "Unknown way of embedding script"
        }
    }
}

export function QRPC(backend: Record<string, Function>, endpointUrl = "/api") {
    const endpointUrlString = endpointUrl + (endpointUrl.includes("?") ? "&" : "?")
    const indent = (text: string, spaces = 2) => text.split("\n").map(x => " ".repeat(spaces) + x).join("\n")
    //.replace(/\:method/g, '" + method + "')
    let script = 
    `const _call = (method, ...args) => {
        const result = fetch(${JSON.stringify(endpointUrlString)} + "method=" + method + "&args=" + encodeURIComponent(JSON.stringify(args)), { method: "POST" })
        const jsonResult = result.then(x => x.json())
        return jsonResult.then(json => {
        if (json.err) throw "Server returned error: " + json.err
        return json.result
        })
    }
    return {\n
      ${Object.keys(backend).map(key => `  ${key}: function (...args) { return _call('${key}', ...args) }`).join(", \n")}
    }`
    script = `(function() {\n${indent(script)}\n})()` // Wrap in IIFE
  
    const handler = async (req: any, res: any) => {
      const method = req.query.method
      const context = { req, res, method }
      try {
        if (req.query.expose || req.query.callback) {
          return await handlerForJsObj(script)(req, res)
        } else if (typeof backend[method] !== 'function') {
          throw `Method '${method}' does not exist`
        } else {
          const args = JSON.parse(req.query.args)
          const result = await backend[method].apply(context, args)
          res.json({result})
        }
      } catch (err) {
        res.json({err})
      }
    }
  
    const setup = (expressApp: {all:Function}) => expressApp.all(endpointUrl, handler)
  
    return { script, handler, setup }
  }