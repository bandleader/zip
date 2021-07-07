<template>
    <span v-if="user" class="d-inline-block text-right" style="font-size: 1.5em">
        <i class="fa fa-user-circle mr-1" style="font-size: 1.2em"></i>
        <b>{{usersName}}</b>
        <br>
        <button type="button" class="btn btn-sm bg-white" style="opacity: 0.7" href="javascript:void(0)" @click="logout">Log out</button>
    </span>
    <span v-else>
        <button class="btn btn-sm btn-primary" type="button" @click="login">Log in</button>
    </span>
</template>

<script>
// TODO Support avatarUrl
// TODO Perhaps cache acct in localStorage for next page run
// TODO Perhaps store acct in root.me (with Vue.set I think? Might require Vue.observable to be observable)
// TODO The login/out methods also have to be accessible to the footer etc., and also to the app

const tokenLsKey = "zipAuthToken" 
export default {
    data: () => ({
        user: null
    }),
    computed: {
        usersName() {
            if (!this.user) return null
            const getProp = prop => this.user["_"+prop] || this.user[prop] || ""
            return getProp("displayName") || getProp("name") || (getProp("firstName") + " " + getProp("lastName")).trim() || "User"
        }
    },
    methods: {
        async login() {
            const email = prompt("Enter your email address:")
            if (!email) return;
            const result = await Zip.ZipAuth.useEmail(email)
            const useTokenResponse = resp => {
                if (!resp) return alert("The code was incorrect.")
                if (resp.error) return alert(resp.error)
                if (!resp.token) return alert("Invalid server response.")
                localStorage.setItem(tokenLsKey, resp.token)
                return this.refresh()
            }
            if (!result) { 
                return alert("No account exists for that email.")
            } else if (result.type === 'code_sent') {
                const code = prompt("A code was sent to your email address\nPlease enter it here:")
                if (!code) return;
                useTokenResponse(await Zip.ZipAuth.loginWithCode(code))
            } else if (result.type === "password") {
                const password = prompt("Please enter your password:")
                if (!password) return;
                useTokenResponse(await Zip.ZipAuth.loginWithEmailAndPassword(email, password))
            } else {
                alert("Unknown server response.")
            }
        },
        async logout() {
            await Zip.ZipAuth.logout()
            localStorage.setItem(tokenLsKey, "")
            this.refresh()
        },
        async refresh() {
            const token = localStorage.getItem(tokenLsKey)
            this.user = token ? (await Zip.ZipAuth.me(token)) : null
        }
    },
    created() {
        this.refresh()    
    }
}
</script>
