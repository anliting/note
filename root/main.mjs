import{
  $tn,Root,component,dom,useCallback,useEffect,useRef,useState
}from'concept'
import NoteEditPage from    './NoteEditPage/main.mjs'
import RootPage from        './RootPage/main.mjs'
import FolderPage from      './FolderPage/main.mjs'
import SettingPage from     './SettingPage/main.mjs'
import UploadManager from   './UploadManager/main.mjs'
import UploadTaskPage from  './UploadTaskPage/main.mjs'
import{api}from             './api/main.mjs'
let{div}=dom
let serviceWorkerRegistration,setStyle
navigator.serviceWorker.addEventListener('message',e=>{
  if(e.data.type=='setStyle')
    return setStyle(e.data.style)
})
let useHistoryStack=(defaultPage)=>{
  let[pageStack,setPageStack]=useState(history.state||defaultPage)
  let pushStack=a=>{
    let state=[...pageStack,[crypto.randomUUID(),...a]]
    history.pushState(state.map(a=>a.slice(0,3)),'')
    setPageStack(state)
  }
  let popStack=()=>{
    if(history.length!=1)
      return history.back()
    let state=pageStack.slice(0,pageStack.length-1)
    history.replaceState(state.map(a=>a.slice(0,3)),'')
    setPageStack(state)
  }
  useEffect(()=>{
    history.replaceState(pageStack,'')
  },[])
  useEffect(function*(){
    let f=e=>setPageStack(e.state)
    addEventListener('popstate',f)
    yield
    removeEventListener('popstate',f)
  },[])
  return[
    pageStack,
    useCallback(stack=>{
      history.replaceState(stack.map(a=>a.slice(0,3)),'')
      setPageStack(stack)
    },[setPageStack]),
    pushStack,popStack
  ]
}
let RootC=component(()=>{
  let style
  ;[style,setStyle]=useState('dark')
  let[bcr,setBcr]=useState([1,1])
  let[pageStack,setStack,pushStack,popStack]=useHistoryStack(
    [[crypto.randomUUID(),'RootPage']]
  )
  let[uploadTask,setUploadTask]=useState([])
  let uploadManager=useRef(new UploadManager({setUploadTask}))
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
    if(pageStack[0][1]=='RootPage'&&me)
      setStack([[crypto.randomUUID(),'FolderPage',{folder:me.folder}]])
    if(pageStack[0][1]=='FolderPage'){
      if(me===null)
        setStack([[crypto.randomUUID(),'RootPage']])
      else if(me&&pageStack[0][2].folder!=me.folder)
        setStack([[crypto.randomUUID(),'FolderPage',{folder:me.folder}]])
    }
  },[pageStack,me])
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
  let[pageUuid,pageName,pageOption,pageSession]=pageStack[pageStack.length-1]
  let page={
    FolderPage:()=>FolderPage({
      cutFolderItem:api.cutFolderItem,
      folder:pageOption.folder,
      folderItem:pageOption.folderItem,
      folderItemName:pageOption.folderItemName,
      goBack:popStack,
      getFolderItemTabByFolder:api.getFolderItemTabByFolder,
      goFolderPage:(folderItem,folderItemName,folder)=>
        pushStack(['FolderPage',{folder,folderItem,folderItemName}]),
      goMoveFolderPage:(folder,movingFolderItem)=>
        pushStack(['MoveFolderPage',{folder,movingFolderItem,layer:0}]),
      goNoteEditPage:note=>pushStack(['NoteEditPage',note]),
      goSettingPage:()=>pushStack(['SettingPage']),
      goUploadTaskPage:()=>pushStack(['UploadTaskPage']),
      key:pageUuid,
      me,
      putBinaryArr:uploadManager.current.put.bind(uploadManager.current),
      putFolder:api.putFolder,
      putNote:async a=>{
        let res=await api.putNote(a)
        if(!(res.type=='ok'))
          console.error(res)
        pushStack(['NoteEditPage',res.note[0].note,{isNew:1}])
      },
      setFolderItemName:api.setFolderItemName,
      uploading:!!uploadTask.length,
    }),
    MoveFolderPage:()=>FolderPage({
      folder:pageOption.folder,
      folderItem:pageOption.folderItem,
      folderItemName:pageOption.folderItemName,
      getFolderItemTabByFolder:api.getFolderItemTabByFolder,
      goBack:popStack,
      goFolderPage:(folderItem,folderItemName,folder)=>
        pushStack(['MoveFolderPage',{
          folder,
          folderItem,
          folderItemName,
          layer:pageOption.layer+1,
          movingFolderItem:pageOption.movingFolderItem,
        }]),
      goNoteEditPage:()=>{},
      key:pageUuid,
      me,
      move:1,
      movingFolderItem:pageOption.movingFolderItem,
      onCancel:()=>{
        history.go(-(pageOption.layer+1))
      },
      onMove:async()=>{
        await api.setFolderItemFolder({
          folder:pageOption.folder,
          folderItem:pageOption.movingFolderItem,
        })
        history.go(-(pageOption.layer+1))
      },
    }),
    NoteEditPage:()=>NoteEditPage({
      cutNote:api.cutNote,
      editingNote:pageOption,
      getNoteByNote:api.getNoteByNote,
      goBack:popStack,
      key:pageUuid,
      session:pageSession||{},
      setNoteBody:api.setNote,
    }),
    RootPage:()=>RootPage({
      goSettingPage:()=>pushStack(['SettingPage']),
      key:pageUuid,
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
      key:pageUuid,
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
    UploadTaskPage:()=>UploadTaskPage({
      cutTask:uploadManager.current.cut.bind(uploadManager.current),
      goBack:popStack,
      key:pageUuid,
      me,
      uploadTask,
    }),
  }[pageName]()
  return div({
    class:['root',style].join(' '),
    style:{
      '--zoom':Math.min(480,bcr[0]),
    },
  },
    page,
  )
})
;(async()=>{
  let root=new Root($tn({}))
  document.body.appendChild(root.node)
  root.render(RootC({}))
  navigator.serviceWorker.register('%23sw')
  serviceWorkerRegistration=await navigator.serviceWorker.ready
  serviceWorkerRegistration.active.postMessage({type:'getStyle'})
})()
