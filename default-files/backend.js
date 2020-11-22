export default {
    greeting(name) { 
        if (!name) throw "Name is required"
        return `Hey there, ${name}!` 
    }
}