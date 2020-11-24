//   ________  ___  ________   
//  |\_____  \|\  \|\   __  \  
//   \|___/  /\ \  \ \  \|\  \ 
//       /  / /\ \  \ \   ____\
//      /  /_/__\ \  \ \  \___|
//     |\________\ \__\ \__\   
//      \|_______|\|__|\|__|   
//                             

import Bundler from './bundler'

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
    this.backend = eval(Bundler.convJsModuleToFunction(backendModuleText, true))
    if (typeof this.backend === 'function') this.backend = this.backend()
    if (Object.keys(this.backend).filter(x => x !== 'greeting').length) {
      console.log("Loaded backend with methods:", Object.keys(this.backend).join(", "))
    }
  }
 
  handleRequest(path: string, req: any, resp: any) {
    // console.log(path)
    if (path === "/favicon.ico") {
      resp.send("404 Not Found")
    } else if (path.startsWith("/api/")) {
      const method = path.split("/")[2]
      const sendErr = (err: any) => resp.send({ err: String(err) })
      if (!this.backend[method]) {
        sendErr(`Backend method '${method}' not found`)
      } else {
        try {
          const args = JSON.parse(req.query.args || '[""]')
          const result = this.backend[method](...args)
          const resultPromise: Promise<any> = result['then'] ? result : Promise.resolve(result)
          resultPromise.then(
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
    // Create RPC for backend methods
    const methods = Object.keys(this.backend)
    scripts.push(`
      function AsyncLoader(factory, _default) {
        var fired = false
        const ret = function() { 
          if (!fired) fire()
          return ret.value
        }        
        Vue.util.defineReactive(ret, 'value', _default || null)
        Vue.util.defineReactive(ret, 'error', null)
        Vue.util.defineReactive(ret, 'loading', false)
        Vue.util.defineReactive(ret, 'ready', false)
        const fire = () => {
          fired = true
          ret.loading = true
          const result = (typeof factory === 'function') ? factory() : factory
          const resultPromise = result.then ? result : Promise.resolve(result)
          resultPromise.then(result => {
            ret.value = result
            ret.loading = false
            ret.ready = true
          }, err => {
            ret.error = err
            ret.loading = false
          })
        }
        fire()
        return ret
      }

      /*function AsyncLoader(factory, _default) {
        const ret = AsyncLoaderLazy(factory, _default)
        ret()
        return ret
      }*/

      function _callZipBackend(method, ...args) {
        const result = fetch("/api/" + method + "?args=" + encodeURIComponent(JSON.stringify(args)), {
          method: "POST"
        })
        const jsonResult = result.then(x => x.json())
        return jsonResult.then(json => {
          if (json.err) throw "Server returned error: " + json.err
          return json.result
        })
      }

      const Backend = {}
    `)
    for (const key of Object.keys(this.backend)) {
      scripts.push(`Backend['${key}'] = (...args) => _callZipBackend('${key}', ...args)`)
      scripts.push(`Backend['${key}'].loader = (_default, ...args) => AsyncLoader(() => _callZipBackend('${key}', ...args), _default)`)
    }

    // Add all Vue components
    const getFileName = (path: string) => path.split("/")[path.split("/").length-1]
    const minusExt = (fileName: string) => fileName.substr(0, fileName.lastIndexOf("."))
    const vues = Object.keys(this.site.files).filter(x => x.endsWith(".vue")).map(localPath => ({ 
      path: localPath, 
      autoRoute: localPath.startsWith('pages/') ? ('/'+minusExt(getFileName(localPath)).replace(/__/g, ':')) : null,
      componentKey: minusExt(getFileName(localPath)).replace(/[^a-zA-Z0-9א-ת]+/g, "-"), 
      contents: this.site.files[localPath].data 
    }))
    scripts.push(...vues.map(v => Bundler.convVueModuleToInitGlobalCode(v.componentKey, Bundler.convVueSfcToJsModule(v.contents, Bundler.vueClassTransformerScript()))))



    // Set up frontend routes
    const vuesPages = vues.filter(x => x.autoRoute)
    scripts.push(`
      const routes = [
        { path: '/', component: window.vues['Home'] || window.vues['home'] },
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
