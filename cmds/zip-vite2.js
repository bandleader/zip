#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const http = require('http')
const port = process.env.PORT || 3000

const { createVuePlugin } = require('vite-plugin-vue2')

const curContext = require('./common.js').getZipContext()

function expressApp(customMiddleware) {
  const express = require('express')
  const app = express()
  app.use(customMiddleware)
  
  app.use((req,res,next) => {
    console.log(req.path)
    if (req.path.startsWith("/api")) curContext.runner.handler(req,res)
    else next()
  })
  app.get("/", (req,res) => res.sendFile(__dirname + "/index.html"))
  // app.use(express.static("./static"))
  // app.use(express.static("./node_modules/zip/default-files/static"))
  return app
}

const files = Object.keys(curContext.runner.site.files).map(path => ({ path, ...curContext.runner.site.files[path] }))

function getNewFrontend() {
  return curContext.runner.getFrontendScript(true)
}

// const pluginProvideIndex = () => ({
//   name: 'pluginProvideIndex',
//   transformIndexHtml() { return "<html><body>Transform has happened!<script src='/virtual/main' type=module></script></body></html>" }
// })

const pluginProvide = obj => {
  return {
    name: 'my-pluginProvideJs',
    resolveId(id) {
      if (obj[id]) {
        return id
      }
    },
    load(id) {
      let ret = obj[id]
      if (!ret) return;
      if (typeof ret === 'function') ret = ret()
      if (typeof ret !== 'string') throw "Must be a string or a function returning one"
      return ret
    }
  }
}

const zipSrcPlugin = () => {
  const find = id => { 
    // console.log("Trying to resolve", id)
    if (id.includes("?")) return;
    const end = id.split("/_ZIPSRC/")[1]; 
    if (!end) return; 
    const find = files.find(x => x.path === end)
    if (!find) { console.error("zipSrcPlugin couldn't find file", end, files.map(x=>x.path)); return; }
    // console.log(" -> Found.")
    return find
  }
  return {
    name: "zipSrcPlugin",
    resolveId(id) { return find(id) ? id : undefined },
    load(id) { return find(id) ? find(id).data : undefined }
  }
}

;(async () => {
  const vite = require("vite")
  const server = await vite.createServer({
    configFile: false,
    root: curContext.root,  //__dirname, // which contains index.html
    publicDir: __dirname + "/../default-files/static",
    server: {
      port,
      middlewareMode: true
    },
    plugins: [
      zipSrcPlugin(),
      pluginProvide({
        "/zipmain": () => curContext.runner.getFrontendScript(),
        "/zipnew": () => getNewFrontend(),
        // "/zipVueClassComponent": () => "var __assign = Object.assign; export default " + require('../dist/index').Bundler.vueClassComponent
      // "/Home.vue": () => curContext.runner.getFile("pages/Home.vue"),
      }),
      createVuePlugin(/*options*/)
    ],//, pluginProvideIndex()],
      // build: {
      //   rollupOptions: {
      //     input: __dirname + "./temp-index.html"
      //   }
      // }
  })
  // console.log(server.middlewares)
  const app = expressApp(server.middlewares)
  await new Promise(res => app.listen(port, res))
  // await server.listen()
  console.log(`🌐 Zip+Vite is listening on http://localhost:${port}`)
})()

