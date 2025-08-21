import{$tn,Root,component,dom,useEffect,useRef,useState}from'concept'
import MapSet from      './MapSet/main.mjs'
import NoteEditPage from'./NoteEditPage/main.mjs'
import RootPage from    './RootPage/main.mjs'
import FolderPage from  './FolderPage/main.mjs'
import SettingPage from './SettingPage/main.mjs'
import{api}from         './api/main.mjs'
let{div}=dom
let serviceWorkerRegistration,setStyle
navigator.serviceWorker.addEventListener('message',e=>{
  if(e.data.type=='setStyle')
    return setStyle(e.data.style)
})
let UploadManager=class{
  #ab
  #getTaskSetByUploading
  #setUploadTask
  #taskSet
  async #tryUpload(){
      /*console.log(
        this.#getTaskSetByUploading(false).size,
        this.#getTaskSetByUploading(true).size,
      )*/
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
      /*console.log(
        this.#getTaskSetByUploading(false).size,
        this.#getTaskSetByUploading(true).size,
      )*/
    }
  }
  constructor({setUploadTask}){
    this.#setUploadTask=setUploadTask
    this.#ab=new AbortController
    this.#taskSet=new MapSet
    this.#getTaskSetByUploading=this.#taskSet.map(a=>a.uploading)
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
        uploading:false,
      })
    this.#tryUpload()
  }
}
let RootC=component(()=>{
  let style
  ;[style,setStyle]=useState('dark')
  let[bcr,setBcr]=useState([1,1])
  let[page,setPage]=useState(history.state||[[crypto.randomUUID(),'RootPage']])
  let[uploadTask,setUploadTask]=useState([])
  let uploadManager=useRef(new UploadManager({setUploadTask}))
  let setStack=stack=>{
    history.replaceState(stack.map(a=>a.slice(0,3)),'')
    setPage(stack)
  }
  let pushStack=a=>{
    let state=[...page,a]
    history.pushState(state.map(a=>a.slice(0,3)),'')
    setPage(state)
  }
  let popStack=()=>history.back()
  useEffect(function*(){
    if(!uploadTask.length)
      return yield
    let f=e=>{
      e.preventDefault()
      e.returnValue=''
    }
    addEventListener('beforeunload',f)
    yield
    removeEventListener('beforeunload',f)
  },[!!uploadTask.length])
  useEffect(()=>{
    history.replaceState(page,'')
  },[])
  useEffect(function*(){
    let f=e=>setPage(e.state)
    addEventListener('popstate',f)
    yield
    removeEventListener('popstate',f)
  },[])
  useEffect(function*(){
    let f=()=>{
      let bcr=document.body.getBoundingClientRect()
      setBcr([bcr.width,bcr.height])
    }
    f()
    addEventListener('resize',f)
    yield
    removeEventListener('resize',f)
  },[])
  let[sessionCheck,setSessionCheck]=useState(Symbol())
  let[me,setMe]=useState()
  useEffect(()=>{
    if(page[0][1]=='RootPage'&&me)
      setStack([[crypto.randomUUID(),'FolderPage',{folder:me.folder}]])
    if(page[0][1]=='FolderPage'){
      if(me===null)
        setStack([[crypto.randomUUID(),'RootPage']])
      else if(me&&page[0][2].folder!=me.folder)
        setStack([[crypto.randomUUID(),'FolderPage',{folder:me.folder}]])
    }
  },[page,me])
  useEffect(function*(){
    let ab=new AbortController
    ;(async()=>{
      try{
        let res=await api.getMe(null,{signal:ab.signal})
        if(ab.signal.aborted)
          throw new DOMException('','AbortError')
        setMe(res.meRow||null)
      }catch(e){
        if(e?.name=='AbortError')
          return
        throw e
      }
    })()
    yield
    ab.abort()
  },[sessionCheck])
  return div({
    class:['root',style].join(' '),
    style:{
      '--zoom':Math.min(480,bcr[0]),
    },
  },
    {
      FolderPage:()=>FolderPage({
        cutFolderItem:api.cutFolderItem,
        folder:page[page.length-1][2].folder,
        folderItem:page[page.length-1][2].folderItem,
        folderItemName:page[page.length-1][2].folderItemName,
        goBack:popStack,
        getFolderItemTabByFolder:api.getFolderItemTabByFolder,
        goFolderPage:(folderItem,folderItemName,folder)=>
          pushStack([crypto.randomUUID(),'FolderPage',{folder,folderItem,folderItemName}]),
        goMoveFolderPage:(folder,movingFolderItem)=>
          pushStack([crypto.randomUUID(),'MoveFolderPage',{folder,movingFolderItem,layer:0}]),
        goNoteEditPage:note=>pushStack([crypto.randomUUID(),'NoteEditPage',note]),
        goSettingPage:()=>pushStack([crypto.randomUUID(),'SettingPage']),
        key:page[page.length-1][0],
        me,
        putBinaryArr:uploadManager.current.put.bind(uploadManager.current),
        putFolder:api.putFolder,
        putNote:async a=>{
          let res=await api.putNote(a)
          if(!(res.type=='ok'))
            console.error(res)
          pushStack([crypto.randomUUID(),'NoteEditPage',res.note[0].note,{isNew:1}])
        },
        setFolderItemName:api.setFolderItemName,
        uploading:!!uploadTask.length,
      }),
      MoveFolderPage:()=>FolderPage({
        folder:page[page.length-1][2].folder,
        folderItem:page[page.length-1][2].folderItem,
        folderItemName:page[page.length-1][2].folderItemName,
        getFolderItemTabByFolder:api.getFolderItemTabByFolder,
        goBack:popStack,
        goFolderPage:(folderItem,folderItemName,folder)=>
          pushStack([crypto.randomUUID(),'MoveFolderPage',{
            folder,
            folderItem,
            folderItemName,
            layer:page[page.length-1][2].layer+1,
            movingFolderItem:page[page.length-1][2].movingFolderItem,
          }]),
        goNoteEditPage:()=>{},
        key:page[page.length-1][0],
        me,
        move:1,
        movingFolderItem:page[page.length-1][2].movingFolderItem,
        onCancel:()=>{
          history.go(-(page[page.length-1][2].layer+1))
        },
        onMove:async()=>{
          await api.setFolderItemFolder({
            folder:page[page.length-1][2].folder,
            folderItem:page[page.length-1][2].movingFolderItem,
          })
          history.go(-(page[page.length-1][2].layer+1))
        },
      }),
      NoteEditPage:()=>NoteEditPage({
        cutNote:api.cutNote,
        editingNote:page[page.length-1][2],
        getNoteByNote:api.getNoteByNote,
        goBack:popStack,
        key:page[page.length-1][0],
        session:page[page.length-1][3]||{},
        setNoteBody:api.setNote,
      }),
      RootPage:()=>RootPage({
        goSettingPage:()=>pushStack([crypto.randomUUID(),'SettingPage']),
        key:page[page.length-1][0],
      }),
      SettingPage:()=>SettingPage({
        goBack:popStack,
        logIn:async(username,password)=>{
          let res=await api.logIn({username,password})
          if(res.type=='ok')
            setSessionCheck(Symbol())
          return res
        },
        logOut:async()=>{
          let res=await api.logOut()
          if(res.type=='ok')
            setSessionCheck(Symbol())
          return res
        },
        key:page[page.length-1][0],
        me,
        register:async(username,password)=>{
          let res=await api.putUser({username,password})
          if(res.type=='ok')
            setSessionCheck(Symbol())
          return res
        },
        setStyle:style=>{
          serviceWorkerRegistration.active.postMessage({
            type:'setStyle',
            style,
          })
        },
        style,
      }),
    }[page[page.length-1][1]](),
  )
})
;(async()=>{
  navigator.serviceWorker.register('%23sw')
  serviceWorkerRegistration=await navigator.serviceWorker.ready
  serviceWorkerRegistration.active.postMessage({type:'getStyle'})
  let root=new Root($tn({}))
  document.body.appendChild(root.node)
  root.render(RootC({}))
})()
