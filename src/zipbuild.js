#!/usr/bin/env node

const { existsSync, writeFileSync, mkdirSync, readFileSync, readdirSync } = require('fs')
const { dirname } = require('path')
const { cwd } = require('process')
const ZipRunner = require('../dist/index')

const defaultFilesDir = __dirname + "/../default-files"
if (!existsSync(defaultFilesDir)) throw "Couldn't find `default-files` directory"

let projRoot = cwd()
while (!existsSync(projRoot + "/package.json")) {
    console.warn("Couldn't find package.json at " + projRoot)
    projRoot = projRoot.replace(/\\/g, "/").split("/").slice(0, projRoot.split("/").length - 1).join("/") // hack off one directory
    console.warn("Trying " + projRoot)
    if (projRoot.length <= 3) throw "Couldn't find `package.json` anywhere"
}

const zipSrcDirectories = [projRoot + "/zip-src", projRoot + "/zipsrc"]
const zipSrcDirectoriesWhereExists = zipSrcDirectories.filter(existsSync)
if (!zipSrcDirectoriesWhereExists.length) throw "No `zip-src` directories found: " + zipSrcDirectories.join(", ")

const packageJson = JSON.parse(readFileSync(projRoot + "/package.json"))
const zipConfig = packageJson.zip || {}
let siteName = zipConfig.siteName || packageJson.name // projRoot.replace(/\\/g, "/").split("/").slice(-1)[0].toUpperCase()
if (!siteName) {
    console.warn("Warning: `zip.siteName` not specified in `package.json`; falling back to `Zip App`")
    siteName = "Zip App"
}

const filesFromDir = (localPath) => {
    const ret = {}
    for (const file of readdirSync(localPath)) {
      ret[file.replace(/--/g, "/")] = { data: readFileSync(`${localPath}/${file}`).toString() }
    }
    return ret
  }

const runner = new ZipRunner({
    siteName: siteName,
    siteBrand: siteName,
    files: {
        ...filesFromDir(__dirname + "/../default-files"),
        ...filesFromDir(zipSrcDirectoriesWhereExists[0])
    }
  }, "http://localhost:8005")

const indexPageContents = runner.getFrontendIndex()

const publicDir = projRoot + "/public"
if (!existsSync(publicDir)) mkdirSync(publicDir)
const outFile = publicDir + "/index.html"
writeFileSync(outFile, indexPageContents)

console.info(`✅ Published '${outFile}'`)


