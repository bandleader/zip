const fs = require('fs')
const process = require('process')
let Zip = require('../dist/index')


function getZipContext() {
    const root = Zip.getPackageRoot()
    const packageJson = JSON.parse(fs.readFileSync(root + "/package.json"))
    const zipConfig = packageJson.zip || {}
    
    const zipSrcDirectories = [root + "/zip-src", root + "/zipsrc"]
    const zipSrcDirectoriesWhereExists = zipSrcDirectories.filter(fs.existsSync)
    if (!zipSrcDirectoriesWhereExists.length) throw "No `zip-src` directories found: " + zipSrcDirectories.join(", ")
    const mainZipSrcPath = zipSrcDirectoriesWhereExists[0]

    const site = {}
    const runner = new Zip.ZipRunner(site)
    return {
        root,
        mainZipSrcPath,
        packageJson,
        zipConfig,
        runner,
        Zip
    }
}

module.exports = {
    getZipContext,
    ZipRunner: Zip.ZipRunner,
    getZip: () => Zip,
    setZip(newZip) { Zip = newZip }
}