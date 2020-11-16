#!/usr/bin/env node

const fs = require('fs')
const context = require('./common.js').getZipContext()

const indexPageContents = context.runner.getFrontendIndex()

const publicDir = context.root + "/public"
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir)
const outFile = publicDir + "/index.html"
fs.writeFileSync(outFile, indexPageContents)

console.info(`✅ Published '${outFile}'`)


