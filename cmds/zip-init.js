#!/usr/bin/env node

const fs = require('fs')
const package = fs.existsSync("./package.json") ? JSON.parse(fs.readFileSync("./package.json")) : null
console.log("\n🎉 Welcome to Zip Init!")

;(async () => {
    // const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout })
    // const question = prompt => new Promise(res => readline.question(prompt, res))
    if (!package) return console.error("`package.json` does not exist in this directory. Please run `npm init` first.")


    const inquirer = require('inquirer')
    const inquire = (type,message, q = {}) => inquirer.prompt([{name: "onlyQuestion", type, message, ...q}]).then(answerObj => answerObj['onlyQuestion'])
    console.log("You can press Enter at any point to accept the default choice.")

    const globDeps = []
    initPackage()

    const zipConfig = package.zip || { siteName: package.name || "MyApp", basePath: "/" }
    zipConfig.siteName = await inquire('input', "Your site name:", { default: zipConfig.siteName })

    const backend = await inquire('confirm', "Would you like a backend?")
    const ts = !backend ? false : await inquire('confirm', "Would you like to use TypeScript for the backend?")    
    
    initZipSrc()

    if (!fs.existsSync("./.gitignore")) fs.writeFileSync("./.gitignore", `# Just the basics -- feel free to get something more complete at http://gitignore.io\n\nnode_modules\n.data/`)

    if (backend) {
        const backendFile = ts ? "./backend.ts" : "./backend.js"
        const runner = ts ? "ts-node-dev" : "node-dev"
        globDeps.push(runner)
        package.scripts.serve = runner + " ./backend" //ext unnec'y
        package.dependencies['github:bandleader/zip'] = package.dependencies['github:bandleader/zip'] || "*"
        // Don't depend on runner or TS, they are global dependencies, will be asked at end of script
        // package.dependencies[runner] = package.dependencies[runner] || "*"
        // if (ts) package.dependencies.typescript = "*"
        // Express dependency no longer necessary
        // package.dependencies.express = package.dependencies.express || "*"

        fs.writeFileSync(backendFile, `
${ts ? "import * as Zip from 'zip'" : "const Zip = require('zip')"}

// Define your backend API here
const backend = {
    greeting(name${ts ? ': string' : ''}) { return \`Hello, \${name}!\` }
}

const site = new Zip.ZipRunner({
  siteName: ${JSON.stringify(zipConfig.siteName)},
${backend ? '  backend,\n' : ''}})
site.serve()
            `)
    } else {
        // No backend
        package.zip = zipConfig
    }
    
    if (ts) globDeps.push("typescript")
    
    writePackage()
    
    console.info("✅ Installing npm packages...")
    const child = require('child_process')
    const onClose = child => new Promise((res,rej) => { child.on('close', code => code ? rej(code) : res(code)); child.on('error', rej) })
    const npmi = child.spawn("cmd", ["/c", "npm i"])
    npmi.stdout.pipe(process.stdout)
    npmi.stderr.pipe(process.stderr)
    const prom = onClose(npmi)
    prom.catch(console.error)
    await prom

    console.info("✅ Done!\n")
    if (globDeps.length) console.info("NOTE: If you haven't yet, install global dependencies by typing:\n\n   npm install -g " + globDeps.join(" ") + "\n")
    console.info("You can run your Zip app by typing:\n\n   npm run serve\n")
})()

function initPackage() {
    if (!package.dependencies) package.dependencies = {}
    if (!package.dependencies.zip) package.dependencies.zip = "github:bandleader/zip"
    if (!package.scripts) package.scripts = {}
    if (!package.scripts.serve) package.scripts.serve = "zip-serve" //"npx --no-install zip-serve"
    if (!package.scripts.build) package.scripts.build = "zip-build" //"npx --no-install zip-build"
}

function initZipSrc() {
    if (!fs.existsSync("./zip-src")) {
        console.info("🥁 Creating `zip-src`...")
        fs.mkdirSync("./zip-src")
        fs.mkdirSync("./zip-src/pages")
        fs.mkdirSync("./zip-src/static")
        // fs.mkdirSync("./zip-src/components")
        fs.writeFileSync("./zip-src/pages/home.vue", fs.readFileSync(__dirname + "/../default-files/pages/home.vue"))
    }
}
    
function writePackage() {
    console.info("🥁 Updating `package.json`...")
    fs.writeFileSync("./package.json", JSON.stringify(package, undefined, 2))
}
