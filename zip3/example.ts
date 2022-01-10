import * as express from 'express'
import * as PATH from 'path'
import * as fs from 'fs'
import * as Zip3 from './zip3'
const home = (path: string) => PATH.join(__dirname, path)
const app = express()
// app.get("/", (req,res) => res.sendFile(home("/example.html")))
app.use(express.static(home("public")))
app.get("/module/:name", (req,res) => {
    const name: string = req.params.name
    const js = fs.readFileSync(home(`public/${name}.js`), { encoding: "utf8" })
        .replace(/export default /g, 'module.exports = ')
    const wrapped = `
        (function() {
            const oldRequire = window.require || ((id) => { throw 'Unknown module ' + id })
            const module = { exports: undefined }
            const runModule = () => { if (module.exports) return module.exports; module.exports = {}; ${js}; return module.exports }        
            window.require = (id) => id !== ${JSON.stringify(name)} ? oldRequire(id) : module.exports || runModule()
        })()
    `
    res.send(wrapped)
})

const zipApp = new Zip3.BackendServices()
app.all('/api/:section?', zipApp.handler())

const port = 3002
app.listen(port, () => console.log(`Listening on http://localhost:${port}`))