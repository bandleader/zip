#!/usr/bin/env node

const fs = require('fs')
const context = require('./common.js').getZipContext()
const http = require('http')
const port = 3000

const server = http.createServer((request, response) => {
  console.log(request.method, request.url)
  response.end(context.runner.getFrontendIndex())
})

server.listen(port, (err) => {
  if (err) {
    return console.log('An error occured: ', err)
  }

  console.log(`zip-serve is listening on http://localhost:${port}`)
})
