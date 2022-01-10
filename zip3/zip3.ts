export class BackendServices {
    handler() {
        const storage: Record<any, string> = {}
        const handler = QRPC({
            storage_getItem(key: string) { return storage[key] },
            storage_setItem(key: string, value: string) { storage[key] = value; return true }
        })
        // const handler = (req: any, res: any) => {
        //     if (String(req.query.method).startsWith("storage_")) return storageHandler.handler(req, res)
        //     throw "Invalid method"
        // }
        return handler
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
        if (req.query.expose) {
          res.send(`window.${req.query.expose} = ${script}`)
        } else if (req.query.callback) {
          res.send(`${req.query.callback}(${script})`)
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