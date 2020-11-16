#!/usr/bin/env node

const fs = require('fs')

const package = fs.existsSync("./package.json") ? JSON.parse(fs.readFileSync("./package.json")) : null
if (!package) throw "`package.json` does not exist in this directory. Please run `npm init` first."

if (!package.dependencies) package.dependencies = {}
if (!package.dependencies.zip) package.dependencies.zip = "github:bandleader/zip"
if (!package.zip) package.zip = { siteName: package.name, basePath: "/" }
if (!package.scripts) package.scripts = {}
if (!package.scripts.serve) package.scripts.serve = "npx --no-install zip-serve"
if (!package.scripts.build) package.scripts.build = "npx --no-install zip-build"

fs.writeFileSync("./package.json", JSON.stringify(package, undefined, 2))

console.info(`✅ Done!`)