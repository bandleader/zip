import * as express from 'express'
import * as bodyParser from "body-parser"
import * as http from 'http'
import * as socketIo from 'socket.io'
import * as fs from "fs"
import fetch from 'node-fetch'
const app = express()
const server = new http.Server(app)
const io = socketIo(server)

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"))

// Ready to listen!
const listener = server.listen(process.env.PORT || 8005, () => {
  console.log(`Your app is listening on port ${(listener.address() as any).port}`)
})

app.get("/", (req,resp) => resp.send("Test OK"))