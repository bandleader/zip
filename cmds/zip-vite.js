#!/usr/bin/env node

const zipCtx = require('./common.js').getZipContext()
const port = process.env.PORT || 3000
const fs = require('fs')
const { resolve } = require('path')

function expressApp(customMiddleware) {
  const express = require('express')
  const app = express()
  app.use((req,res,next) => (console.info(req.method + ":", req.path), next()))
  app.use(customMiddleware)
  app.use((req,res,next) => {
    if (req.path.startsWith("/api")) zipCtx.runner.handler(req,res)
    else next()
  })
  app.use(express.static(resolve(zipCtx.mainZipSrcPath, "static")))
  app.use(express.static(resolve(__dirname, "../default-files/static")))
  app.get("*", (req,res) => res.send(zipCtx.runner.getFrontendIndex(true)))
  return app
}

const customProvide = (fn2) => {
  let fn = (...args) => args[0].includes('?') ? undefined : fn2(...args)
  return {
    name: 'customProvidePlugin',
    resolveId: (...args) => (fn(...args) && args[0]) || undefined,
    load: (...args) => fn(...args) || undefined,
  }
}


function checkAndLoadDeps() {
  const tryRequire = (moduleName) => { try { return require(moduleName) } catch { return false } }
  const vers = [
    { ver: 2, deps: "vite-plugin-vue2 vue-template-compiler", vuePlugin: (opts) => require('vite-plugin-vue2').createVuePlugin(opts) },
    { ver: 3, deps: "@vitejs/plugin-vue @vue/compiler-sfc", vuePlugin: (opts) => require('@vitejs/plugin-vue').default(opts) }
  ]
  const vue = tryRequire("vue"), vite = tryRequire("vite")
  const bail = (err) => { console.error(err); process.exit(1); throw err /* just in case*/ }
  if (!vue || !vite) bail(`To use vite, please install dependencies:\n  npm install vue vite ${vers[0].deps}\n  -- OR --\n  npm install vue vite ${vers[1].deps}`)
  const installedVer = vers.find(x => x.ver === parseInt(vue.version))
  if (!installedVer) bail("Unrecognized Vue version: " + vue.version)
  if (installedVer.ver === 3) bail(`We are not set up yet to work with Vue 3. Install Vue 2:\n\n  npm install vue@2 ${vers[0].deps}`)
  const missingDeps = installedVer.deps.split(" ").filter(x => !tryRequire(x))
  if (missingDeps.length) bail(`Missing dependencies for Vue ${installedVer.ver}:\n  npm install ${missingDeps.join(" ")}`)
  // All good!
  return { version: vue.version, vite, vuePlugin: installedVer.vuePlugin }
}

;(async () => {
  const { vite, vuePlugin } = checkAndLoadDeps()
  const server = await vite.createServer({
    configFile: false,
    root: zipCtx.mainZipSrcPath,
    //  Now doing in other middleware. -- publicDir: __dirname + "/../default-files/static",
    server: {
      port,
      middlewareMode: true
    },
    plugins: [
      vuePlugin(/*opts*/),
      customProvide((id,from) => {
        // console.log("ABOUT TO RESOLVE",id,from)
        let ret = undefined
        const isZipDefFiles = id.split("/_ZIPDEFAULTFILES/")
        if (isZipDefFiles[1]) {
          const filename = resolve(__dirname, "../default-files", isZipDefFiles[1])
          if (!fs.existsSync(filename)) console.error("ZIPDEFAULTFILES could not find", id, "at path", filename, "called from", from || "?")
          else ret = fs.promises.readFile(filename, { encoding: "UTF8" })
        }
        if (id === "/zip-frontend-generated-code.js") ret = zipCtx.runner.getFrontendScript()
        // console.log("--> RETURNING",id, ret && ret.length)
        return ret
      })
    ],
  })
  zipCtx.runner.constructor.mode = "VITE"
  const app = expressApp(server.middlewares)
  await new Promise(res => app.listen(port, res))
  console.log(`🌐 Zip+Vite is listening on http://localhost:${port}`)
})()

