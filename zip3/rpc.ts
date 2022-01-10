export function handlerForJsObj(script: string) {
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
            if (json.err) {
                console.error("RPC: Server returned error:", json.err)
                throw "Server returned error: " + JSON.stringify(json.err)    
            }
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
        console.error(`Error in RPC action '${method}':`, err)
        res.json({err})
      }
    }
  
    const setup = (expressApp: {all:Function}) => expressApp.all(endpointUrl, handler)
  
    return { script, handler, setup }
  }