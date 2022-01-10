

const autoheight = {
    mounted(el) { 
            el.style.height = '1em'
            el.style.height = el.scrollHeight + 'px'
            el.style.resize = 'none' // hide resize grabber
            el.style.overflowY = 'hidden'
            el.addEventListener("input", () => {
                el.style.height = "auto"
                el.style.height = el.scrollHeight + "px"
            }, false)
        }
}

export default {
    components: { WithSession },
    directives: { autoheight },
    props: ['session'],
    data: () => ({
        notes: []
    }),
    async created() {
        this.notes = await this.session.storage.getItem("notes") || []
        this.$watch('notes', x => this.session.storage.setItem("notes", x), { deep: true })
    },
    template: `
<div class="container p-2">
    <div class="row">
        <div class="offset-md-3 col-md-6">
            <div class="card clickable mt-4 text-muted" @click="notes.unshift({text:''})">
                <div class="card-body">
                    <i>Take a note</i>
                    <span style="float: right" @click.stop="notes.unshift({text: '', tasks: [{complete: false,text:''}]})"><i class="fa fa-tasks"></i></span>
                </div>
            </div>
        </div>
    </div>
    <div class="row">
        <div v-for="n in notes" class="col-md-4">
            <div class="card clickable mt-4 ">
                <input class="form-control" :style="n.title ? {fontSize: '1.1em', fontWeight: 'bold'} : { opacity: 0.5 }" style="border-width: 0; box-shadow: none;" v-model="n.title" placeholder="Note title">
                <textarea v-model="n.text" class="form-control" v-autoheight 
                    style="border-width: 0; height: 1em; box-shadow: none;" 
                    :style="(n.text && n.text.length < 50 && n.text.split('\\n').length <= 3) ? {fontSize: '1.2em'} : null"
                    placeholder="Type your note here"></textarea>
                <div v-for="t in n.tasks || []">
                    <div class="d-flex">
                        <input v-model="t.complete" type="checkbox" class="m-2">
                        <input v-model="t.text" placeholder="List item" 
                            style="flex: 1; border-width: 0; width: 100%;" 
                            :style="t.complete ? {opacity: 0.5, textDecoration: 'line-through'} : null"
                            @keydown.delete="t.text || (n.tasks=n.tasks.filter(x=>x!==t))" 
                            @keyup="n.tasks.filter(x=>!x.text).length || n.tasks.push({complete: false,text:''})">
                    </div>
                </div>
            </div>
        </div>  
    </div>
</div>
  `,
}