//   ________  ___  ________   
//  |\_____  \|\  \|\   __  \  
//   \|___/  /\ \  \ \  \|\  \ 
//       /  / /\ \  \ \   ____\
//      /  /_/__\ \  \ \  \___|
//     |\________\ \__\ \__\   
//      \|_______|\|__|\|__|   
//                             

import bundler from './bundler'

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

export default class ZipRunner {
  constructor(public site: ZipSite) { 
    site.siteBrand = site.siteBrand || site.siteName
    site.router = site.router || {}
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
 
  handleRequest(path: string, req: any, resp: any) {
    console.log(path)
    if (path === "/favicon.ico") {
      resp.send("404 Not Found")
    } else {
      resp.send(this.getFrontendIndex())
    }
  }

  getFrontendScript() {
    const scripts: string[] = []
    // TODO Create RPC for backend methods

    // Add all Vue components
    const getFileName = (path: string) => path.split("/")[path.split("/").length-1]
    const minusExt = (fileName: string) => fileName.substr(0, fileName.lastIndexOf("."))
    const vues = Object.keys(this.site.files).filter(x => x.endsWith(".vue")).map(localPath => ({ 
      path: localPath, 
      componentKey: minusExt(getFileName(localPath)).replace(/[^a-zA-Z0-9א-ת]+/g, "-"), 
      contents: this.site.files[localPath].data 
    }))
    scripts.push(...vues.map(v => bundler.convVueModuleToInitGlobalCode(v.componentKey, bundler.convVueSfcToJsModule(v.contents))))



    // Set up frontend routes
    const vuesPages = vues.filter(x => x.path.startsWith("pages/"))
    scripts.push(`
      const routes = [
        { path: '/', component: window.vues['Home'] },
        ${vuesPages.map(v =>`{ path: '/${v.componentKey}', component: window.vues['${v.componentKey}'] }`).join(", ")}
      ]
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
