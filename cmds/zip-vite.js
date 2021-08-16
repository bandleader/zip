#!/usr/bin/env node

const zipCtx = require('./common.js').getZipContext()
const port = process.env.PORT || 3000
const { resolve } = require('path')
const { checkAndLoadDeps, zipFsProvider } = zipCtx.Zip.ViteEtc

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

;(async () => {
  zipCtx.Zip.ZipRunner.mode = 'VITE'
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
      zipFsProvider(zipCtx.runner)
    ],
  })
  const app = expressApp(server.middlewares)
  await new Promise(res => app.listen(port, res))
  console.log(`🌐 Zip+Vite is listening on http://localhost:${port}`)
})()

