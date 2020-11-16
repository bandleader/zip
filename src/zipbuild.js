const { existsSync, writeFileSync, mkdirSync } = require('fs')
const { dirname } = require('path')
const { cwd } = require('process')
const ZipRunner = require('../dist/index')

const defaultFilesDir = __dirname + "/../default-files"
if (!existsSync(defaultFilesDir)) throw "Couldn't find `default-files` directory"

const projRoot = dirname(require.main.filename)
if (!projRoot) throw "Couldn't get project root"

const zipSrcDirectories = [projRoot + "/zip-src", projRoot + "/zipsrc"]
const zipSrcDirectoriesWhereExists = zipSrcDirectories.filter(existsSync)
if (!zipSrcDirectoriesWhereExists.length) throw "No `zip-src` directories found: " + zipSrcDirectories.join(", ")

let siteName = process.argv[0] || projRoot.replace(/\\/g, "/").split("/").slice(-1)[0].toUpperCase()
if (!siteName) {
    console.warn("siteName CLI argument not specified; using `Zip App`")
    siteName = "Zip App"
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


