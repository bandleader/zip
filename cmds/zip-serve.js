#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const http = require('http')
const port = 3000

const cache = (factory, immed) => {
  let value = null, valid = false, first = true
  const recompute = () => { value = factory(first); first = false; valid = true; return value }
  const get = () => valid ? value : recompute()
  const recomputeSoon = (ms = 50) => { valid = false; setTimeout(get, ms) }
  const invalidate = () => valid = false
  if (immed) recompute()
  
  // Return a function with properties
  get.recompute = recompute
  get.recomputeSoon = recomputeSoon
  get.invalidate = invalidate
  return get
}

const curContext = cache(first => {
  if (!first) console.info(new Date().toLocaleTimeString(), "File change detected; reloading Zip site.")
  return require('./common.js').getZipContext()
}, true)
const watchDir = dir => {
  fs.watch(dir, {}, () => curContext.recomputeSoon())
  // Also watch subdirectories
  for (const subdir of fs.readdirSync(dir)) {
    const subdirPath = path.join(dir, subdir)
    if (fs.statSync(subdirPath).isDirectory()) watchDir(subdirPath)
  }
}
watchDir(curContext().root)


const server = http.createServer((request, response) => {
  console.log(request.method, request.url)
  request.query = require('url').parse(request.url, true).query
  response.send = x => (typeof x === 'object') ? response.end(JSON.stringify(x)) : response.end(x)
  curContext().runner.handleRequest(request.url.split("?")[0], request, response)
  //response.end(curContext().runner.getFrontendIndex())
})

server.listen(port, (err) => {
  if (err) {
    return console.log('An error occured: ', err)
  }

  console.log(`
  ________  ___  ________   
 |\_____  \|\  \|\   __  \  
  \|___/  /\ \  \ \  \|\  \ 
      /  / /\ \  \ \   ____\
     /  /_/__\ \  \ \  \___|
    |\________\ \__\ \__\   
     \|_______|\|__|\|__|   
                         
zip-serve is listening on http://localhost:${port}`)
})
