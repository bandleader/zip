#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const http = require('http')
const port = process.env.PORT || 3000 

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

function throttled({ms, delay}, fn) {
  let lastCall = 0, timeout = null
  const attempt = (alreadyDelayed, ...args) => {
    // console.log("Attempt", alreadyDelayed, !!timeout)
    const now = () => { lastCall = Date.now(); timeout = null; fn(...args) }
    const timeSinceLastCall = Date.now() - lastCall
    // It should run in [delay], unless it already ran recently, in which case 
    let timeToWait = alreadyDelayed ? 0 : (delay||0)
    timeToWait = Math.max(timeToWait, (lastCall + (ms||0)) - Date.now())
    // console.log(timeToWait)
    if (timeToWait <= 0) now()
    else if (!timeout) timeout = setTimeout(() => attempt(true, ...args), timeToWait + 5)
  }
  return (...args) => attempt(false, ...args)
}

const curContext = cache(first => require('./common.js').getZipContext(), true)
const throttledRecompute = throttled({delay: 250, ms: 150}, () => {
  console.info(new Date().toLocaleTimeString(), `File change detected; reloading Zip site.`)
  curContext.recomputeSoon()
})
const watchDir = dir => {
  if (path.basename(dir) === "node_modules") return;
  if (path.basename(dir).startsWith(".") ) return; // Ignore hidden dirs like .git, .bin, .cache, .idea
  fs.watch(dir, {}, (ev, filename,c) => {
    if ([".git"].includes(filename)) return; // it registers a directory change whenever something
    // console.log(ev, filename)
    throttledRecompute()
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

  // Check for static file
  const normalizedStaticRoot = path.normalize(curContext().root + '/static')
  const normalizedRequestLocalPath = path.normalize(`${normalizedStaticRoot}/${request.url}`)
  if (normalizedRequestLocalPath.startsWith(normalizedStaticRoot) && fs.existsSync(normalizedRequestLocalPath) && fs.statSync(normalizedRequestLocalPath).isFile()) {
    const stat = fs.statSync(normalizedRequestLocalPath)
    console.log('=>', normalizedRequestLocalPath)
    response.writeHead(200, {
      // TODO: Send content-type. Maybe just throw in the towel and use Express...
      // 'Content-Type': 'audio/mpeg', 
      'Content-Length': stat.size
    })
    const readStream = fs.createReadStream(normalizedRequestLocalPath)
    readStream.pipe(response)
  } else {
    // Pass to Zip
    request.query = require('url').parse(request.url, true).query
    response.send = x => (typeof x === 'object') ? response.end(JSON.stringify(x)) : response.end(x)
    curContext().runner.handleRequest(request.url.split("?")[0], request, response)
    //response.end(curContext().runner.getFrontendIndex())
  }
})

server.listen(port, (err) => {
  if (err) {
    return console.log('An error occured: ', err)
  }

  console.log(`
  ________  ___  ________   
 |\\_____  \\|\\  \\|\\   __  \\
  \\|___/  /\\ \\  \\ \\  \\|\\  \\ 
      /  / /\\ \\  \\ \\   ____\\
     /  /_/__\\ \\  \\ \\  \\___|
    |\\________\\ \\__\\ \\__\\   
     \\|_______|\\|__|\\|__|   
                         
zip-serve is listening on http://localhost:${port}`)
})
