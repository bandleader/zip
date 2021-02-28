//   ________  ___  ________   
//  |\_____  \|\  \|\   __  \  
//   \|___/  /\ \  \ \  \|\  \ 
//       /  / /\ \  \ \   ____\
//      /  /_/__\ \  \ \  \___|
//     |\________\ \__\ \__\   
//      \|_______|\|__|\|__|   
//                             

import * as Bundler2 from './bundler'
export const Bundler = Bundler2
import GraphQueryRunner from './graph'


type Dict<T> = Record<string, T>
type ZipSite = { 
  siteName: string, 
  siteBrand?: string, 
  files: Dict<ZipFile>, 
  basePath?: string /*include slashes. default is "/" */,
  router?: {
    mode?: string
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
  }
 
  handleRequest(path: string, req: any, resp: any) {
    // console.log(path)
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
    } else if (path.startsWith("/api/")) {
      const method = path.split("/")[2]
      if (!this.backend[method]) {
        sendErr(`Backend method '${method}' not found`)
      } else {
        try {
          const args = JSON.parse(req.query.args || '[""]')
          let result = null 
          if (method === "graph") {
            const queryObj = args[0]
            let resolver = this.backend[method]
            result = GraphQueryRunner.resolve(resolver, queryObj)
          } else {
            result = this.backend[method](...args)
          }          
          const resultPromise: Promise<any> = result['then'] ? result : Promise.resolve(result)
          return resultPromise.then(
            result => resp.send({ result }),
            sendErr
          )          
        } catch (ex) {
          sendErr(ex)
        }
      }
    } else {
      resp.send(this.getFrontendIndex())
    }
  }

  getFrontendScript() {
    const scripts: string[] = []
    scripts.push(this.getFile("zip-client.js"))

    // Create RPC for backend methods
    const methods = Object.keys(this.backend)    
    for (const key of Object.keys(this.backend)) {
      scripts.push(`Zip.Backend['${key}'] = (...args) => Zip.Backend._call('${key}', ...args)`)
      scripts.push(`Zip.Backend['${key}'].loader = (_default, ...args) => Zip.Utils.asyncLoader(() => Zip.Backend._call('${key}', ...args), _default)`)
    }

    // Add all Vue components
    const getFileName = (path: string) => path.split("/")[path.split("/").length-1]
    const minusExt = (fileName: string) => fileName.substr(0, fileName.lastIndexOf("."))
    const vues = Object.keys(this.site.files).filter(x => x.endsWith(".vue")).map(path => { 
      const autoRoute = path.startsWith('pages/') ? ('/'+minusExt(path.substr(6)).replace(/__/g, ':')) : null
      return {
        path, autoRoute,
        componentKey: minusExt(autoRoute ? path : getFileName(path)).replace(/[^a-zA-Z0-9א-ת]+/g, "-"), 
        contents: this.site.files[path].data 
      }
    })
    scripts.push(...vues.map(v => Bundler.VueSfcs.convVueModuleToInitGlobalCode(v.componentKey, Bundler.VueSfcs.convVueSfcToJsModule(v.contents, Bundler.VueSfcs.vueClassTransformerScript()))))



    // Set up frontend routes
    const vuesPages = vues.filter(x => x.autoRoute)
    scripts.push(`
      const routes = [
        { path: '/', component: window.vues['pages-Home'] || window.vues['pages-home'] },
        ${vuesPages.map(v =>`{ path: '${v.autoRoute}', component: window.vues['${v.componentKey}'] }`).join(", ")}
      ]
      // Add special routes for components that declare one
      Object.values(window.vues).forEach(comp => {
        if (comp.route) { 
          routes.push({ path: comp.route, component: comp })
        }
      })
      const router = new VueRouter({
        routes,
        base: '${this.site.basePath || "/"}',
        mode: '${this.site.router!.mode || 'history'}'
      })`)
    
      // Call Vue
    scripts.push(`
      vueApp = new Vue({ 
        el: '#app', 
        router, 
        data: { 
          App: {
            identity: {
              showLogin() { alert("TODO") },
              logout() { alert("TODO") },
            }
          }, 
          siteName: \`${this.site.siteName}\`,
          deviceState: { user: null },
          navMenuItems: ${JSON.stringify(vuesPages.filter(x => x.path.substr(9,1) === x.path.substr(9, 1).toUpperCase()).map(x => ({url: '/' + x.componentKey, text: x.path.substr(9, x.path.length-9-4)})))},
        },
        created() {
        }
      })`)
    return scripts.join("\n")
  }
 
}
