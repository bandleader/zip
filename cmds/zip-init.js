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

if (!fs.existsSync("./zip-src")) {
    console.info("🥁 Creating `zip-src`...")
    fs.mkdirSync("./zip-src")
    fs.writeFileSync("./zip-src/pages--Home.vue", fs.readFileSync(__dirname + "/../default-files/pages--Home.vue"))
}

console.info("🥁 Updating `package.json`...")
fs.writeFileSync("./package.json", JSON.stringify(package, undefined, 2))

console.info("✅ Done! Remember to run `npm install` if you haven't yet installed the `zip` dependency.")