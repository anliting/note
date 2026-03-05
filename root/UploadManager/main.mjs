import MapSet from          '../MapSet/main.mjs'
export default class{
  #getTaskSetByUploading
  #setUploadTask
  #taskSet
  async #tryUpload(){
    while(
      this.#getTaskSetByUploading(false).size&&
      this.#getTaskSetByUploading(true).size<4
    ){
      let t=[...this.#getTaskSetByUploading(false)][0]
      let{
        file,
        folder,
        setFolderItemTabT,
      }=t
      this.#taskSet.set(t,t=>t.uploading=true)
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
          if(!(200<=xhr.status&&xhr.status<300))
            return console.error(xhr)
          let res=JSON.parse(xhr.responseText)
          if(!(res.type=='ok'))
            return console.error(res)
          this.#taskSet.delete(t)
          this.#tryUpload()
          this.#setUploadTask([...this.#taskSet])
          setFolderItemTabT(Symbol())
        }
        xhr.onerror=e=>console.error(e)
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
    this.#getTaskSetByUploading=this.#taskSet.map(a=>a.uploading)
  }
  async cut(t){
    if(t.uploading)
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
        abortController:new AbortController,
        file,
        folder,
        setFolderItemTabT,
        uploading:false,
      })
    this.#tryUpload()
  }
}
