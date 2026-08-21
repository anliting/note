import MapSet from          '../MapSet/main.mjs'
export default class{
  #getTaskSetByState
  #setUploadTask
  #taskSet
  #fail(t,error){
    this.#taskSet.set(t,t=>{
      t.state='error'
      t.error=error
    })
    this.#tryUpload()
    this.#setUploadTask([...this.#taskSet])
  }
  async #tryUpload(){
    while(
      this.#getTaskSetByState('pending').size&&
      this.#getTaskSetByState('uploading').size<4
    ){
      let t=[...this.#getTaskSetByState('pending')][0]
      let{
        file,
        folder,
        setFolderItemTabT,
      }=t
      this.#taskSet.set(t,t=>t.state='uploading')
      ;(async()=>{
        let xhr=new XMLHttpRequest
        t.xhr=xhr
        xhr.open('POST','%23putBinary')
        xhr.upload.onprogress=e=>{
          if(!e.lengthComputable)
            return
          t.loaded=e.loaded
          t.total=e.total
          this.#setUploadTask([...this.#taskSet])
        }
        xhr.onload=()=>{
          if(!(200<=xhr.status&&xhr.status<300)){
            console.error(xhr)
            return this.#fail(t,`HTTP ${xhr.status}`)
          }
          let res=JSON.parse(xhr.responseText)
          if(!(res.type=='ok')){
            console.error(res)
            return this.#fail(t,res.type)
          }
          this.#taskSet.delete(t)
          this.#tryUpload()
          this.#setUploadTask([...this.#taskSet])
          setFolderItemTabT(Symbol())
        }
        xhr.onerror=()=>this.#fail(t,'network error')
        xhr.ontimeout=()=>this.#fail(t,'timeout')
        let formData=new FormData
        formData.append('file',file)
        formData.append('folder',folder)
        xhr.send(formData)
      })()
    }
  }
  constructor({setUploadTask}){
    this.#setUploadTask=setUploadTask
    this.#taskSet=new MapSet
    this.#getTaskSetByState=this.#taskSet.map(a=>a.state)
  }
  async cut(t){
    if(t.state=='uploading')
      t.xhr.abort()
    this.#taskSet.delete(t)
    this.#tryUpload()
    this.#setUploadTask([...this.#taskSet])
  }
  async put({
    files,
    folder,
    setFolderItemTabT,
  }){
    for(let file of[...files])
      this.#taskSet.add({
        file,
        folder,
        setFolderItemTabT,
        state:'pending',
      })
    this.#tryUpload()
  }
  async retry(t){
    if(!(t.state=='error'))
      return
    this.#taskSet.set(t,t=>{
      t.state='pending'
      delete t.error
      delete t.loaded
      delete t.total
    })
    this.#tryUpload()
    this.#setUploadTask([...this.#taskSet])
  }
}
