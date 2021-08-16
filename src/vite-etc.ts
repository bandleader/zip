import * as path from 'path'
import * as fs from 'fs'
import ZipRunner from './zip-runner'

export function quickRollupProvidePlugin(fn2: Function) {
    let fn = (...args: any[]) => args[0].includes('?') ? undefined : fn2(...args)
    return {
      name: 'customProvidePlugin',
      resolveId: (...args: any[]) => (Promise.resolve(fn(...args)).then(x => x ? args[0] : undefined)),
      load: (...args: any[]) => fn(...args) || undefined,
    }
}
  
export function checkAndLoadDeps() {
    const tryRequire = (moduleName: string) => { try { return require(moduleName) } catch { return false } }
    const vers = [
        { ver: 2, deps: "vite-plugin-vue2 vue-template-compiler", vuePlugin: (opts?: any) => require('vite-plugin-vue2').createVuePlugin(opts) },
        { ver: 3, deps: "@vitejs/plugin-vue @vue/compiler-sfc", vuePlugin: (opts?: any) => require('@vitejs/plugin-vue').default(opts) }
    ]
    const vue = tryRequire("vue"), vite = tryRequire("vite")
    const bail = (err: string) => { console.error(err); process.exit(1); throw err /* just in case*/ }
    if (!vue || !vite) bail(`To use vite, please install dependencies:\n  npm install vue vite ${vers[0].deps}\n  -- OR --\n  npm install vue vite ${vers[1].deps}`)
    const installedVer = vers.find(x => x.ver === parseInt(vue.version))
    if (!installedVer) bail("Unrecognized Vue version: " + vue.version)
    if (installedVer.ver === 3) bail(`We are not set up yet to work with Vue 3. Install Vue 2:\n\n  npm install vue@2 ${vers[0].deps}`)
    const missingDeps = installedVer.deps.split(" ").filter(x => !tryRequire(x))
    if (missingDeps.length) bail(`Missing dependencies for Vue ${installedVer.ver}:\n  npm install ${missingDeps.join(" ")}`)
    // All good!
    return { version: vue.version, vite, vuePlugin: installedVer.vuePlugin }
}
  
export function zipFsProvider(zr: ZipRunner, opts: { includingNonDefault?: boolean } = {}) {
    return quickRollupProvidePlugin(async (id: string, from: string) => {
        console.log("ABOUT TO RESOLVE",id,from)
        let ret = undefined
        const zipDefaultFilePath = id.split("/_ZIPDEFAULTFILES/")[1]
        if (id === "/zip-frontend-generated-code.js") ret = await zr.getFrontendScript()
        else if (zipDefaultFilePath) { // Return a 'default-file'
          const filename = path.resolve(__dirname, "../default-files", zipDefaultFilePath)
          if (!fs.existsSync(filename)) console.error("zipFsProvider could not find DefaultFile", id, "at path", filename, "called from", from || "?")
          else ret = await fs.promises.readFile(filename, { encoding: "UTF8" })
        } else if (opts.includingNonDefault && !id.startsWith("/@")) { // Find file locally. Not necessary for Vite as it has the root directory. Also not even sure if it's working, as it would probably disable HMR, and it does not
            const files = zr.files.getFiles(), pathLookingFor = id.substr(1)
            const file = files.find(x => x.path === pathLookingFor) || files.find(x => x.path === pathLookingFor + ".ts") || files.find(x => x.path === pathLookingFor + ".js")
            if (!file) console.error("zipFsProvider could not find Zip file", id, "in site 'files' collection")
            else ret = await fs.promises.readFile(file.localPath, { encoding: "UTF8" })
        }
        return ret
      })
  }