#!/usr/bin/env node

const fs = require('fs')
const context = require('./common.js').getZipContext()

const publicDir = context.root + "/zip-output"

async function go() {
    const built = context.runner.build(publicDir)
    console.info(`✅ Published to '${publicDir}'`)
}
go()


