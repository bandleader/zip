//   ________  ___  ________   
//  |\_____  \|\  \|\   __  \  
//   \|___/  /\ \  \ \  \|\  \ 
//       /  / /\ \  \ \   ____\
//      /  /_/__\ \  \ \  \___|
//     |\________\ \__\ \__\   
//      \|_______|\|__|\|__|   
//                             

import * as _Bundler from './bundler'
export const Bundler = _Bundler
import GraphQueryRunner from './graph'
import * as Identity from './identity'


type Dict<T> = Record<string, T>
type ZipSite = { 
  siteName: string, 
  siteBrand?: string, 
  files: Dict<ZipFile>, 
  basePath?: string /*include slashes. default is "/" */,
  router?: {
    mode?: "history"|"hash"
  }
}
type ZipFile = { data: string }

function clearableScheduler() {
  let timeouts: number[] = [], intervals: number[] = []
  const addAndReturn = (arr: number[], item: number) => (arr.push(item), item)
  return {
    setTimeout: (fn: Function, ms: number) => addAndReturn(timeouts, setTimeout(fn, ms)),
    setInterval: (fn: Function, ms: number) => addAndReturn(timeouts, setInterval(fn, ms)),
    clear() { timeouts.forEach(clearTimeout); intervals.forEach(clearInterval); timeouts = []; intervals = [] },
  }
}

export default class ZipRunner {
  backend: any
  backendRpc: ReturnType<typeof quickRpc>
  auth = Identity.Loginner()
  authRpc = quickRpc(this.auth.api, "/api/auth")

  constructor(public site: ZipSite) { 
    site.siteBrand = site.siteBrand || site.siteName
    site.router = site.router || {}
    
    this.startBackend()
  }

  getFile(path: string) {
    if (!this.site.files[path]) throw `File '${path}' not found in zip`
    return this.site.files[path].data
  }
  
  getFrontendIndex() {
    let scriptsToInclude = this.getFrontendScript()
    let contents = this.getFile("index.html")
    contents = contents.replace(/\{\{siteName\}\}/g, this.site.siteName)
    contents = contents.replace(/\{\{siteBrand\}\}/g, this.site.siteBrand || this.site.siteName)
    // Inject script
    contents = contents.replace(/<\/body>/g, `<script>${scriptsToInclude}</script></body>`)
    return contents
  }

  startBackend() {
    // TODO use clearableScheduler
    const backendModuleText = this.getFile("backend.js")
    this.backend = Bundler.evalEx(Bundler.SimpleBundler.moduleCodeToIife(backendModuleText, undefined, true), { require })
    if (typeof this.backend === 'function') this.backend = this.backend()
    if (Object.keys(this.backend).filter(x => x !== 'greeting').length) {
      console.log("Loaded backend with methods:", Object.keys(this.backend).join(", "))
    }

    // Allow graph queries
    const graphResolver = this.backend.graph
    if (graphResolver) this.backend.graph = (queryObj: any) => GraphQueryRunner.resolve(graphResolver, queryObj)
    
    this.backendRpc = quickRpc(this.backend, "/api/qrpc")
  }
 
  handleRequest(path: string, req: any, resp: any) {
    if (!resp.json) resp.json = (obj: any) => resp.send(JSON.stringify(obj))
    
    const sendErr = (err: any) => resp.send({ err: String(err) })
    /*const tryWith = (msgPrefix: string, fn: Function) => {
      try {
        const result = fn()
        if (result.catch) result.catch(sendErr)
        return result
      } catch (ex) {
        sendErr(`${msgPrefix}${ex}`)
      }
    }*/

    if (path === "/favicon.ico") {
      resp.send("404 Not Found")
    } else if (path == "/_zipver") {
      resp.send(require('../package.json').version)
    } else if (path === "/api/qrpc") {
      this.backendRpc.handler(req, resp)
    } else if (path === "/api/auth") {
      this.authRpc.handler(req, resp)
    } else if (path.startsWith("/api/")) {
      // REST API -- not currently implemented because we have to think about arg types being only string...
      const method = path.split("/")[2]
      throw "REST API not yet implemented"
    } else {
      resp.send(this.getFrontendIndex())
    }
  }

  getFrontendScript() {
    const scripts: string[] = []
    scripts.push(this.getFile("zip-client.js"))
    scripts.push("Zip.Backend = " + this.backendRpc.script) // RPC for backend methods
    scripts.push("Zip.ZipAuth = " + this.authRpc.script) // RPC for auth methods
    const vueFiles = Object.keys(this.site.files).filter(x => x.endsWith(".vue")).map(path => ({ path, contents: this.site.files[path].data }))
    scripts.push(ZipFrontend.fromMemory(vueFiles, {...this.site, siteBrand: this.site.siteBrand! /* we assigned it in the constructor */ }).script())
    return scripts.join("\n")
  }
 
}

export function quickRpc(backend: Record<string, Function>, endpointUrl = "/api") {
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
}\n`
  script += "return {\n" + 
    Object.keys(backend).map(key => `  ${key}(...args) { return _call('${key}', ...args) }`)
    .join(", \n") + "\n}"
  
  // Wrap in IIFE
  script = `(function() {\n${indent(script)}\n})()`

  const handler = async (req: any, res: any) => {
    const method = req.query.method
    const context = { req, res, method }
    try {
      if (req.query.expose) {
        res.send(`window.${req.query.expose} = ${script}`)
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

  const setup = (expressApp: {post:Function}) => expressApp.post(endpointUrl, handler)

  return { script, handler, setup }
}

type ZipFrontendOptions = { basePath?: string, router?: { mode?: "history"|"hash" }, siteBrand: string }
export class ZipFrontend {
  files: { path: string, contents: string }[] = []
  options: ZipFrontendOptions
  static fromMemory(files: { path: string, contents: string }[], options: ZipFrontendOptions) {
    const ret = new ZipFrontend()
    ret.files = files
    ret.options = options
    return ret
  }
  _vueFiles() {
    const getFileName = (path: string) => path.split("/")[path.split("/").length - 1]
    const minusExt = (fileName: string) => fileName.substr(0, fileName.lastIndexOf("."))
    return this.files.filter(f => f.path.endsWith(".vue")).map(f => {
      const autoRoute = 
        f.path === "pages/Home.vue" ? "/"
        : f.path.startsWith('pages/') ? ('/' + minusExt(f.path.substr(6)).replace(/__/g, ':')) 
        : null
      const componentKey = minusExt(getFileName(f.path)).replace(/[^a-zA-Z0-9א-ת]+/g, "-")
      return { ...f, autoRoute, componentKey }
    })
  }
  _vueModules() {
    return this._vueFiles().map(vueFile => {
      // Provide a default component name
      let mutationCode = `exp.name = exp.name || ${JSON.stringify(vueFile.componentKey)}\n`
      // Provide a default 'route' options key (feel free to override)
      if (vueFile.autoRoute) mutationCode += `exp.route = exp.route || ${JSON.stringify(vueFile.autoRoute)}\n`
      
      return Bundler.VueSfcs.convVueSfcToJsModule(vueFile.contents, Bundler.VueSfcs.vueClassTransformerScript(), mutationCode)
    })
  }
  script() {
    const out: string[] = []
    const vueModules = this._vueModules()
    out.push(`const vues = [${vueModules.map(vm => Bundler.SimpleBundler.moduleCodeToIife(vm)).join(", ")}]`)
    // Register the components globally
    out.push("const registerGlobally = x => Vue.component(x.name, x)")
    out.push("vues.forEach(registerGlobally)")
    // Set up routes and call VueRouter
    out.push(`
const routes = vues.map((v, i) => ({ path: v.route, component: vues[i] })).filter(x => x.path)
const router = new VueRouter({
  routes,
  base: '${this.options.basePath || "/"}',
  mode: '${this.options.router?.mode || 'history'}'
})`)
    // Call Vue
    out.push(`
const vueApp = new Vue({ 
  el: '#app', 
  router, 
  data: { 
    App: {
      identity: {
        showLogin() { alert("TODO") },
        logout() { alert("TODO") },
      }
    }, 
    siteBrand: ${JSON.stringify(this.options.siteBrand)},
    navMenuItems: vues.filter(v => v.menuText).map(v => ({ url: v.route, text: v.menuText })),
    deviceState: { user: null },
  },
  created() {
  }
})`)
    // return ";(function(){\n" + out.join("\n") + "\n})()"
    return out.join("\n")
  }
}
