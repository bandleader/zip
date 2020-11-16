#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const http = require('http')
const port = 3000

const cache = (factory, immed) => {
  const value = null, valid = false
  const recompute = () => { value = factory(); valid = true; return value }
  const get = () => valid ? value : recompute()
  const recomputeOnNextTick = () => { valid = false; setTimeout(get, 1) }
  const invalidate = () => valid = false
  if (immed) recompute()
  
  // Return a function with properties
  get.recompute = recompute
  get.recomputeOnNextTick = recomputeOnNextTick
  get.invalidate = invalidate
  return get
}

const curContext = cache(() => require('./common.js').getZipContext(), true)
const watchDir = dir => {
  fs.watch(dir, {}, () => {
    console.info(new Date().toLocaleTimeString(), "File change detected, reloading Zip site.")
    curContext.recomputeOnNextTick()
  })
  // Also watch subdirectories
  for (const subdir of fs.readdirSync(dir)) {
    const subdirPath = path.join(dir, subdir)
    if (fs.statSync(subdirPath).isDirectory()) watchDir(subdirPath)
  }
}
watchDir(curContext().root)


const server = http.createServer((request, response) => {
  console.log(request.method, request.url)
  response.end(curContext().runner.getFrontendIndex())
})

server.listen(port, (err) => {
  if (err) {
    return console.log('An error occured: ', err)
  }

  console.log(`zip-serve is listening on http://localhost:${port}`)
})
