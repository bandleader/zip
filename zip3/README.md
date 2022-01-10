- Signup
- Simple 'RemoteStorage'
- Admin Frontend to manage users & view their storage
- Later, more DB-like things; just sync is hard
- RPC
    - Later: graph via Deepr
- Persisting arbitrary objects to FS?
- Later: Option to use WebSockets
- Real-time Analytics
- Historical Analytics -- just log in a compact format, every pageview and every event ('pageload' is an event), and frontend will download any files it doesn't have, and analyze. Or can just host a Plausible/Umami (clones of each other) or Matomo (clone of GA) container per app (and 1 MySql etc for them to use). We can maybe even embed their tracking code...
- More ideas: Live chat, transactional email, contact form

### Multi-App Host (but best to use Dokku or even write as a [Dokku pluggin](https://dokku.com/docs/community/plugins/))
- Click "new app" to create a new instance of Zip3. You get a script tag, just customize it to connect to the API on the remote server (CORS required of CORS)
- Zip can even serve your frontend out of `<specified directory>/public`, so that you don't need a separate deployment for that
- And can even run your Node backend (serverless-style) out of `<specified directory>/backend/index.js/ts`, giving RPC on the object exported (or the object returned by the function exported, and the function gets called with each request), and persisting your objects to FS. Should also have access to user data
- Can even run containers you specify (maybe in a `docker-compose.yml` file); will bring them up and down when you ask. (https://agustincb.github.io/docker-api/ or simply call out to docker-compose, or even see https://github.com/francescou/docker-compose-ui)
- Can track a git repo -- prob the easiest way is to provide an endpoint to accept files, or a ZIP file, then your CI/CD should send files there (prob first send a filelist with hashes to see what needs to be transferred). There must be a tool to do this. Then it restarts the backend if that changed, and any containers that changed in the definition file.