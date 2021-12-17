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
import type * as ExpressType from 'express' // These definitions are more correct than via require('express') for some reason. But I don't want to top-level-import it because unless serving there is no need for it
import * as _ViteEtc from './vite-etc'
export const ViteEtc = _ViteEtc

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
  basePath?: string /*include slashes. default is "/" */,
  router?: {
    mode?: "history"|"hash"
  },
  backend?: Record<string, Function>,
}

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
  const getFilesInner = (dirPrefix = ""): { path: string, localPath?: string }[] => {
    const localDir = resolve(root, dirPrefix)
    return flatMap(fs.readdirSync(localDir), file => {
      const localPath = `${localDir}/${file}`
      return fs.statSync(localPath).isDirectory()
        ? getFilesInner(`${dirPrefix}${file}/`)
        : [ { path: dirPrefix + file, localPath } ]
    })
  }
  const getFiles = () => getFilesInner() // because we don't want the dirPrefix argument exposed
  const readFileSync = (path: string) => {
    const localPath = resolve(root, path)
    // console.log(`Local FS: Reading ${path} (${localPath})`)
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
  }

  async build(outputDir: string) {
    fs.mkdirSync(outputDir, { recursive: true })
    const staticFiles = this.files.getFiles().filter(x => x.path.startsWith('static/'))
    for (const f of staticFiles) {
      const outputPath = `${outputDir}/${f.path.substr(7)}`
      // console.log(f.localPath, outputPath)
      const dirOfOutputPath: string = require('path').dirname(outputPath)
      if (!fs.existsSync(dirOfOutputPath)) fs.mkdirSync(dirOfOutputPath, { recursive: true })
      fs.copyFileSync(f.localPath, outputPath)
    }
    fs.writeFileSync(`${outputDir}/index.html`, this.getFrontendIndex())
    fs.writeFileSync(`${outputDir}/zip-frontend-generated-code.js`, await this.getFrontendScript())
  }

  serve(opts: { app?: Express.Application, preBind?: (app: Express.Application) => void, port?: number, listen?: boolean } = {}) {
    const Express = require('express')
    const app: ExpressType.Application = opts.app || Express()
    if (opts.preBind) opts.preBind(app)
    app.use(Express.static("./zip-src/static"))
    app.use(Express.static(__dirname + "/../default-files/static"))
    app.all("*", this.handler)
    const port = opts.port || process.env.PORT || 3000
    if (opts.listen !== false) app.listen(port, () => { 
      console.info(`Your Zip app is listening on http://localhost:${port}`)
    })
    return app
  }

  getFile(path: string) {
    // if (!this.site.files[path]) throw `File '${path}' not found in zip`
    // return this.site.files[path].data
    return this.files.readFileSync(path)
  }
  static mode: "ZIPBUNDLER"|"VITE"|"ROLLUP" = "ZIPBUNDLER"
  
  getFrontendIndex() {
    let contents = this.getFile("index.html")
    contents = contents.replace(/\{\%siteName\}/g, this.site.siteName)
    contents = contents.replace(/\{\%siteBrand\}/g, this.site.siteBrand || this.site.siteName)
    contents = contents.replace(/\{\%basePath\}/g, this.site.basePath)
    // Inject script tag
    const scriptTag = `<script src="${this.site.basePath}zip-frontend-generated-code.js" ${ZipRunner.mode === "ZIPBUNDLER" ? '' : 'type="module"'}></script>`
    contents = contents.replace(/<\/body>/g, `${scriptTag}</body>`)
    return contents
  }

  startBackend() {
    let backend = this.site.backend!
    
    // Allow using a file in the Zip VFS called `backend.js`
    if (!backend) {
      const backendModuleText = this.files.getFiles().some(x => x.path==="backend.js") ? this.getFile("backend.js") : ""
      // TODO use clearableScheduler
      backend = Bundler.evalEx(Bundler.SimpleBundler.moduleCodeToIife(backendModuleText), { require })
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

  async handleRequest(path: string, req: any, resp: any) {
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
    } else if (path == "/zip-frontend-generated-code.js") {
      resp.setHeader('Content-Type', 'text/javascript') // For some reason this isn't working, and so modules aren't working when in Express
      resp.send(await this.getFrontendScript())
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

  async getFrontendScript() {
    const scripts: string[] = []
    scripts.push(this.getFile("zip-client.js"))
    scripts.push("Zip.Backend = " + this.backendRpc.script) // RPC for backend methods
    scripts.push("Zip.ZipAuth = " + this.authRpc.script) // RPC for auth methods
    const vueFiles = this.files // passing extra files won't hurt
    scripts.push(new ZipFrontend(vueFiles, {...this.site, siteBrand: this.site.siteBrand! /* we assigned it in the constructor */ }).script())
    let out = scripts.join("\n")
    if (ZipRunner.mode === "ROLLUP") {
      const deps = ViteEtc.checkAndLoadDeps()
      const build = await deps.vite.build({
        root: getPackageRoot() + '/zip-src',
        plugins: [
          deps.vuePlugin(),
          ViteEtc.zipFsProvider(this)
        ],
        build: {
          write: false,
          rollupOptions: {
            input: "/zip-frontend-generated-code.js",
          }
        },
      })
      console.log("BUILD PRODUCED:", build)
      out = (build as any).output.map((x: any) => x.type === 'chunk' ? x.code : '').join("\n;\n")
    }
    // Let's ESBuild it, to support TS
    out = require('esbuild').transformSync(out, {
      loader: 'ts'
    }).code    

    return out
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
    const usedNames: string[] = []
    return this.files.getFiles().filter((f) => f.path.endsWith(".vue")).map((f,i) => {
      const autoRoute = 
        f.path === "pages/home.vue" ? "/"
        : f.path.startsWith('pages/') ? ('/' + minusExt(f.path.substr(6)).replace(/__/g, ':')) 
        : null
      let componentKey = minusExt(getFileName(f.path)).replace(/[^a-zA-Z0-9א-ת]+/g, "-")
      // Make componentKey safe and unique
      if (componentKey.startsWith("-")) componentKey = 'z' + componentKey
      if (componentKey.endsWith("-")) componentKey = componentKey + 'z'
      if (autoRoute && usedNames.includes(componentKey)) componentKey += "-" + i
      usedNames.push(componentKey)

      return { ...f, autoRoute, componentKey }
    })
  }
  _vueModules() {
    return this._vueFiles().map(vueFile => {
      return Bundler.VueSfcs.convVueSfcToESModule(this.files.readFileSync(vueFile.path), { classTransformer: Bundler.VueSfcs.vueClassTransformerScript() })
    })
  }

  script(vue3 = false) {
    const newMode = ZipRunner.mode !== "ZIPBUNDLER"
    const files = this._vueFiles()
    const lines = (x: (file: typeof files[0], i: number)=>string) => files.map(x).filter(x => x).join("\n")
    let ret = `
      // Import the Vue files
      ${lines((f,i) => newMode
         ? `import vue${i} from '/${f.localPath?.includes("default-files") ? '_ZIPDEFAULTFILES/' : ''}${f.path}'` 
         : `const vue${i} = ${Bundler.SimpleBundler.moduleCodeToIife(Bundler.VueSfcs.convVueSfcToESModule(this.files.readFileSync(f.path), { classTransformer: Bundler.VueSfcs.vueClassTransformerScript() }))}`
        )}
      const vues = [${files.map((_,i) => `vue${i}`)}]
            
      `
      
      const storeFile = this.files.getFiles().find(x => x.path === "store.ts" || x.path === "store.js")
      if (storeFile) ret += `
        ${newMode ? "import store from '/store'" : "const store = " + Bundler.SimpleBundler.moduleCodeToIife(this.files.readFileSync(storeFile.path))}
        window['store'] = store // To easily reference from JS components without importing
        Vue.mixin({
          data() {
            return {
              store: store
            }
          }
        })
      `

      // Register all globally for Vue2
      if (!vue3) ret += lines((x, i) => `Vue.component(${JSON.stringify(x.componentKey)}, vue${i})`)
      
      // Set up routes
      ret += `
      ${lines((x,i) => x.autoRoute ? `vue${i}.route = vue${i}.route || ${JSON.stringify(x.autoRoute)}` : "")}
      const routes = vues.map((x,i) => ({ path: x.route, component: x })).filter(x => x.path)
      const router = new VueRouter({
        routes,
        base: '${this.options.basePath || "/"}',
        mode: '${this.options.router?.mode || 'history'}'
      })

      // Call Vue
      const vueApp = ${vue3 ? 'Vue.createApp' : 'new Vue'}({ 
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

    // Register all globally for Vue3
    if (vue3) ret+= lines((x, i) => `app.component(${JSON.stringify(x.componentKey)}, vue${i})`) 

    return ret
  }
}
