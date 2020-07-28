import * as express from 'express'
import * as bodyParser from "body-parser"
import * as http from 'http'
import * as socketIo from 'socket.io'
import * as fs from "fs"
import fetch from 'node-fetch'
import ZipRunner from './src/zip-runner'
const app = express()
const server = new http.Server(app)
const io = socketIo(server)

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"))


// Run a test zip
const filesFromDir = (localPath: string) => {
  const ret = {} as Record<string, { data:string }>
  for (const file of fs.readdirSync(localPath)) {
    ret[file.replace(/--/g, "/")] = { data: fs.readFileSync(`${localPath}/${file}`).toString() }
  }
  return ret
}
const testZipRunner = new ZipRunner({
  siteName: "TestZip",
  siteBrand: "TestZip",
  files: filesFromDir("./default-files")
}, "http://localhost:8005", "", "testZip")
app.get("*", (req,resp) => testZipRunner.handleRequest(req.path, req, resp))

// Ready to listen!
const listener = server.listen(process.env.PORT || 8005, () => {
  console.log(`Your app is listening on port ${(listener.address() as any).port}`)
})

// app.get("/", (req,resp) => resp.send("Test OK"))