#!/usr/bin/env node

const zipCtx = require('./common.js').getZipContext()
const port = process.env.PORT || 3000
const fs = require('fs')
const { resolve } = require('path')
let vite;
try {
  vite = require("vite")
} catch {
  console.error("To use vite, install it first by typing: \n  npm install --save-dev vite vite-plugin-vue2 vue vue-template-compiler")
  process.exit()
}

function expressApp(customMiddleware) {
  const express = require('express')
  const app = express()
  app.use(customMiddleware)
  app.use((req,res,next) => {
    console.log(req.method + ":", req.path)
    if (req.path.startsWith("/api")) zipCtx.runner.handler(req,res)
    else next()
  })
  app.get("/", (req,res) => res.send(zipCtx.runner.getFrontendIndex(true)))
  app.use(express.static(resolve(zipCtx.root, "static")))
  app.use(express.static(resolve(__dirname, "../default-files/static")))
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

;(async () => {
  const server = await vite.createServer({
    configFile: false,
    root: zipCtx.mainZipSrcPath,
    //  Now doing in other middleware. -- publicDir: __dirname + "/../default-files/static",
    server: {
      port,
      middlewareMode: true
    },
    plugins: [
      require('vite-plugin-vue2').createVuePlugin(/*options*/),
      customProvide((id,from) => {
        // console.log("MUST RESOLVE",id,from)
        let ret = undefined
        const isZipDefFiles = id.split("/_ZIPDEFAULTFILES/")
        if (isZipDefFiles[1]) ret = fs.readFileSync(resolve(__dirname, "../default-files", isZipDefFiles[1].replace(/\//g, "--")), { encoding: "UTF8" })
        if (id === "/_ZIPFRONTENDSCRIPT") ret = zipCtx.runner.getFrontendScript(true)
        // console.log("--> RETURNING",id, ret && ret.length)
        return ret
      })
    ],
  })
  const app = expressApp(server.middlewares)
  await new Promise(res => app.listen(port, res))
  console.log(`🌐 Zip+Vite is listening on http://localhost:${port}`)
})()

