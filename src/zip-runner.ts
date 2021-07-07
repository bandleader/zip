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
import * as fs from 'fs'

export function getPackageRoot() {
  let projRoot = process.cwd()
  while (!(require('fs').existsSync(projRoot + "/package.json"))) {
      console.warn("Couldn't find package.json at " + projRoot)
      projRoot = projRoot.replace(/\\/g, "/").split("/").slice(0, projRoot.split("/").length - 1).join("/") // hack off one directory
      console.warn("Trying " + projRoot)
      if (projRoot.length <= 3) throw "Couldn't find `package.json` anywhere"
  }
  return projRoot
}


type Dict<T> = Record<string, T>
type ZipSite = { 
  siteName?: string, 
  siteBrand?: string, 
  app?: any, // For Express
  basePath?: string /*include slashes. default is "/" */,
  router?: {
    mode?: "history"|"hash"
  },
  backend?: Record<string, Function>,
}
type ZipFile = { data: string, isDefault: boolean }

function clearableScheduler() {
  let timeouts: number[] = [], intervals: number[] = []
  const addAndReturn = (arr: number[], item: number) => (arr.push(item), item)
  return {
    setTimeout: (fn: Function, ms: number) => addAndReturn(timeouts, setTimeout(fn, ms)),
    setInterval: (fn: Function, ms: number) => addAndReturn(timeouts, setInterval(fn, ms)),
    clear() { timeouts.forEach(clearTimeout); intervals.forEach(clearInterval); timeouts = []; intervals = [] },
  }
}

function flatMap<T, U>(array: T[], callbackfn: (value: T, index: number, array: T[]) => U[]): U[] {
  return Array.prototype.concat(...array.map(callbackfn));
}
function localFilesystem(root: string) {
  const resolve = (...args: string[]): string => require('path').resolve(...args).replace(/\\/g, "/")
  const localRoot = resolve(root)
  const getFiles = (dirPrefix = ""): { path: string, localPath?: string }[] => {
    const localDir = resolve(root, dirPrefix)
    return flatMap(fs.readdirSync(localDir), file => {
      const localPath = `${localDir}/${file}`
      return fs.statSync(localPath).isDirectory()
        ? getFiles(`${dirPrefix}${file}/`)
        : [ { path: dirPrefix + file, localPath } ]
    })
  }
  const readFileSync = (path: string) => {
    const localPath = resolve(root, path)
    if (!localPath.startsWith(localRoot + "/")) throw `Path ${path} is below the root`
    return fs.readFileSync(localPath, { encoding: "utf8" })
  }
  // console.log("ADDED FILESYSTEM:",{localRoot,files: getFiles()})
  return { getFiles, readFileSync }
}
function multirootFilesystem(fss: LocalFS[]): LocalFS {
  return {
    getFiles() {
      const all = flatMap(fss, x => x.getFiles())
      const paths: string[] = []
      return all.filter(x => {
        if (paths.includes(x.path)) return false
        paths.push(x.path)
        return true
      })
    },
    readFileSync(path: string) {
      let firstEx: any = null
      for (const fs of fss) {
        try {
          return fs.readFileSync(path)
        } catch (e) { firstEx = firstEx || e }
      }
      throw firstEx
    }
  }
}

type LocalFS = ReturnType<typeof localFilesystem>

export class ZipRunner {
  backendRpc: ReturnType<typeof quickRpc>
  auth = Identity.Loginner()
  authRpc = quickRpc(this.auth.api, "/api/auth")
  files: LocalFS
  constructor(public site: ZipSite = {}) { 
    if (true /*no public option for virtual FS yet*/) {
      // Load from filesystem based on package.json root
      const pkgRoot = getPackageRoot()
      this.files = multirootFilesystem([
        localFilesystem(`${pkgRoot}/zip-src`),
        localFilesystem(`${__dirname}/../default-files`)
      ])
      const packageJson = JSON.parse(fs.readFileSync(pkgRoot + "/package.json", { encoding: "utf8" })) // require(root + '/package.json')
      const zipConfig = packageJson.zip || {}
      for (const k in zipConfig) (site as any)[k] = zipConfig[k] // TODO apply deeply
      site.siteName = site.siteName || packageJson.name
    }

    // Set some defaults
    site.siteName = site.siteName || "Zip Site"
    site.siteBrand = site.siteBrand || site.siteName
    site.router = site.router || {}
    site.basePath = site.basePath || "/"
    
    this.startBackend()

    if (site.app) {
      const express = require('express')
      site.app.use(express.static("./static"))
      site.app.use(express.static("./node_modules/zip/default-files/static"))
      site.app.all("*", this.handler)
    }
  }

  getFile(path: string) {
    // if (!this.site.files[path]) throw `File '${path}' not found in zip`
    // return this.site.files[path].data
    return this.files.readFileSync(path)
  }
  
  getFrontendIndex(newMode = false) {
    let contents = this.getFile("index.html")
    contents = contents.replace(/\{\%siteName\}/g, this.site.siteName)
    contents = contents.replace(/\{\%siteBrand\}/g, this.site.siteBrand || this.site.siteName)
    contents = contents.replace(/\{\%basePath\}/g, this.site.basePath)
    // Inject script
    const scriptTag = newMode ? `<script src="/_ZIPFRONTENDSCRIPT" type="module"></script>` : `<script>${this.getFrontendScript()}</script>`
    contents = contents.replace(/<\/body>/g, `${scriptTag}</body>`)
    return contents
  }

  startBackend() {
    let backend = this.site.backend!
    
    // Allow using a file in the Zip VFS called `backend.js`
    if (!backend) {
      const backendModuleText = this.files.getFiles().some(x => x.path==="backend.js") ? this.getFile("backend.js") : ""
      // TODO use clearableScheduler
      backend = Bundler.evalEx(Bundler.SimpleBundler.moduleCodeToIife(backendModuleText, undefined, true), { require })
      if (typeof backend === 'function') backend = (backend as any).backend()
    }
    
    if (Object.keys(backend).filter(x => x !== 'greeting').length) {
      console.log("Loaded backend with methods:", Object.keys(backend).join(", "))
    }

    // Allow graph queries
    const graphResolver = backend.graph
    if (graphResolver) backend.graph = (queryObj: any) => GraphQueryRunner.resolve(graphResolver, queryObj)
    
    this.backendRpc = quickRpc(backend, `${this.site.basePath}api/qrpc`)
  }
 
  get handler() { 
    return (req: any, resp: any) => {
      this.handleRequest(req.path, req, resp)
    }
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

  getFrontendScript(newMode = false) {
    const scripts: string[] = []
    scripts.push(this.getFile("zip-client.js"))
    scripts.push("Zip.Backend = " + this.backendRpc.script) // RPC for backend methods
    scripts.push("Zip.ZipAuth = " + this.authRpc.script) // RPC for auth methods
    const vueFiles = this.files // passing extra files won't hurt
    scripts.push(new ZipFrontend(vueFiles, {...this.site, siteBrand: this.site.siteBrand! /* we assigned it in the constructor */ }).script(newMode))
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
export default ZipRunner

type ZipFrontendOptions = { basePath?: string, router?: { mode?: "history"|"hash" }, siteBrand: string }
export class ZipFrontend {
  constructor(public files: LocalFS, public options: ZipFrontendOptions) { }
  _vueFiles() {
    const getFileName = (path: string) => path.split("/")[path.split("/").length - 1]
    const minusExt = (fileName: string) => fileName.substr(0, fileName.lastIndexOf("."))
    return this.files.getFiles().filter(f => f.path.endsWith(".vue")).map(f => {
      const autoRoute = 
        f.path === "pages/home.vue" ? "/"
        : f.path.startsWith('pages/') ? ('/' + minusExt(f.path.substr(6)).replace(/__/g, ':')) 
        : null
      const componentKey = minusExt(getFileName(f.path)).replace(/[^a-zA-Z0-9א-ת]+/g, "-")
      return { ...f, autoRoute, componentKey }
    })
  }
  _vueModules() {
    return this._vueFiles().map(vueFile => {
      return Bundler.VueSfcs.convVueSfcToESModule(this.files.readFileSync(vueFile.path), { classTransformer: Bundler.VueSfcs.vueClassTransformerScript() })
    })
  }

  script(newMode = false) {
    const files = this._vueFiles()
    const lines = (x: (file: typeof files[0], i: number)=>string) => files.map(x).filter(x => x).join("\n")
    return `
      // Import the Vue files
      ${lines((f,i) => newMode
         ? `import vue${i} from '/${f.localPath?.includes("default-files") ? '_ZIPDEFAULTFILES/' : ''}${f.path}'` 
         : `const vue${i} = ${Bundler.SimpleBundler.moduleCodeToIife(Bundler.VueSfcs.convVueSfcToESModule(this.files.readFileSync(f.path), { classTransformer: Bundler.VueSfcs.vueClassTransformerScript() }))}`
        )}
      const vues = [${files.map((_,i) => `vue${i}`)}]
      
      // Register all globally
      ${lines((x, i) => `Vue.component(${JSON.stringify(x.componentKey)}, vue${i})`)}

      // Set up routes
      ${lines((x,i) => x.autoRoute ? `vue${i}.route = vue${i}.route || ${JSON.stringify(x.autoRoute)}` : "")}
      const routes = vues.map((x,i) => ({ path: x.route, component: x })).filter(x => x.path)
      const router = new VueRouter({
        routes,
        base: '${this.options.basePath || "/"}',
        mode: '${this.options.router?.mode || 'history'}'
      })

      // Call Vue
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
      })
    `
  }
}
