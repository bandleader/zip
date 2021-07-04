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

    if (backend) {
        const backendFile = ts ? "./app.ts" : "./app.js"
        const runner = ts ? "ts-node-dev" : "node-dev"
        globDeps.push(runner)
        package.scripts.serve = runner + " " + backendFile
        package.dependencies.express = package.dependencies.express || "*"
        //${backend ? `import backend from './backend'\n` : ''}
            fs.writeFileSync(backendFile, `
import * as express from 'express'
import * as Zip from 'zip'

const backend = {
    greeting(name) { return \`Hello, \${name}!\` }
}

const app = express()
const site = new Zip.ZipRunner({${backend ? '\n  backend,' : ''}
  siteName: ${JSON.stringify(zipConfig.siteName)}
})
app.use("*", site.middleware)
app.listen(process.env.PORT || 8050, () => {
  console.info(\`Your Zip app is listening on http://localhost:\${port}\`)
})
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

    console.info("✅ Done!")
    if (globDeps.length) console.info("NOTE: If you haven't yet, install global dependencies by typing:\n\n   npm install -g " + globDeps.join(" "))
    console.log("")
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
        fs.mkdirSync("./zip-src/components")
        fs.writeFileSync("./zip-src/pages/Home.vue", fs.readFileSync(__dirname + "/../default-files/pages--Home.vue"))
    }
}
    
function writePackage() {
    console.info("🥁 Updating `package.json`...")
    fs.writeFileSync("./package.json", JSON.stringify(package, undefined, 2))
}
