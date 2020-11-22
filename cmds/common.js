const fs = require('fs')
const process = require('process')
const ZipRunner = require('../dist/index')

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

function filesFromDir(localPath) {
    const ret = {}
    for (const file of fs.readdirSync(localPath)) {
        const path = `${localPath}/${file}`
        if (fs.statSync(path).isDirectory()) {
            const loadDir = filesFromDir(path)
            for (const key in loadDir) ret[`${file}/${key}`] = loadDir[key]
        } else {
            ret[file.replace(/--/g, "/")] = { data: fs.readFileSync(path).toString() }
        }
    }
    return ret
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
            ...filesFromDir(__dirname + "/../default-files"),
            ...filesFromDir(zipSrcDirectoriesWhereExists[0])
        }
    }
    for (const k in zipConfig) site[k] = zipConfig[k]

    const runner = new ZipRunner(site, "http://localhost:8005")
    return {
        root,
        packageJson,
        zipConfig,
        runner
    }
}

module.exports = {
    getZipContext,
    filesFromDir,
    getPackageRoot,
    ZipRunner
}