const fs = require('fs')
const process = require('process')
let Zip = require('../dist/index')

function getPackageRoot() {
    let projRoot = process.cwd()
    while (!fs.existsSync(projRoot + "/package.json")) {
        console.warn("Couldn't find package.json at " + projRoot)
        projRoot = projRoot.replace(/\\/g, "/").split("/").slice(0, projRoot.split("/").length - 1).join("/") // hack off one directory
        console.warn("Trying " + projRoot)
        if (projRoot.length <= 3) throw "Couldn't find `package.json` anywhere"
    }
    return projRoot
}

function getZipContext() {
    const root = getPackageRoot()
    const packageJson = JSON.parse(fs.readFileSync(root + "/package.json"))
    const zipConfig = packageJson.zip || {}
    
    const zipSrcDirectories = [root + "/zip-src", root + "/zipsrc"]
    const zipSrcDirectoriesWhereExists = zipSrcDirectories.filter(fs.existsSync)
    if (!zipSrcDirectoriesWhereExists.length) throw "No `zip-src` directories found: " + zipSrcDirectories.join(", ")

    const site = {
        siteName: "Zip Site",
        files: {
            ...Zip.ZipFrontend._filesFromDir(__dirname + "/../default-files", fs),
            ...Zip.ZipFrontend._filesFromDir(zipSrcDirectoriesWhereExists[0], fs)
        }
    }
    for (const k in zipConfig) site[k] = zipConfig[k]

    const runner = new Zip.default(site, "http://localhost:8005")
    return {
        root,
        packageJson,
        zipConfig,
        runner
    }
}

module.exports = {
    getZipContext,
    getPackageRoot,
    ZipRunner: Zip.default,
    setZip(newZip) { Zip = newZip }
}