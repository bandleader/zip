export default {
    greeting(name) { 
        if (!name) throw "Name is required"
        return `Hey there, ${name}!` 
    },
    graph: {
        greeting(name) {
            if (!name) throw "Name is required"
            return `Hey there, ${name}!` 
        },
        delayed: (ms = 2000) => new Promise(res => {
            setTimeout(() => res(ms + " ms have passed!"), ms)
        }),
        list: ["One", "Two", "Three"],
        numbers: (till = 100) => Array.from(Array(till)).map((_,i) => 1 + i),
        john: { 
            firstName: "John", 
            lastName: "Smith" 
        },
        customers(nameFilter = "") {
            return [
                { firstName: "Jacob", lastName: "Roberts" },
                { firstName: "Simon", lastName: "Williams" },
                { firstName: "Joe", lastName: "Abrahams" }
            ].filter(x => x.firstName.includes(nameFilter) || x.lastName.includes(nameFilter))
        },
    }
}