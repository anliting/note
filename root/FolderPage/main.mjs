import{
  $tn,component,dom,useEffect,useRef,useState
}from'concept'
import ContextMenu from '../ContextMenu/main.mjs'
import TopBar from      '../TopBar/main.mjs'
import FolderItem from  './FolderItem/main.mjs'
let{button,div,input}=dom
export default component(({
  cutFolderItem,
  folder,
  folderItem,
  folderItemName,
  getFolderItemTabByFolder,
  goBack,
  goFolderPage,
  goMoveFolderPage,
  goNoteEditPage,
  goSettingPage,
  goUploadTaskPage,
  move,
  movingFolderItem,
  me,
  onCancel,
  onMove,
  putBinaryArr,
  putFolder,
  putNote,
  setFolderItemName,
  uploading,
})=>{
  let[folderItemTab,setFolderItemTab]=useState([])
  let[folderItemTabT,setFolderItemTabT]=useState(Symbol())
  let[selectedFolderItem,setSelectedFolderItem]=useState(null)
  let[dropzone,setDropzone]=useState()
  let[folderItemMenu,setFolderItemMenu]=useState(null)
  let[addMenu,setAddMenu]=useState(null)
  let pageRef=useRef()
  let folderInputRef=useRef()
  useEffect(()=>{
    if(me)
      pageRef.current.focus()
  },[me])
  useEffect(function*b(){
    if(!me)
      return yield
    let ab=new AbortController
    ;(async()=>{
      let res
      try{
        res=await getFolderItemTabByFolder({folder},{signal:ab.signal})
      }catch(e){
        if(e?.name=='AbortError')
          return
        throw e
      }
      if(ab.signal.aborted)
        return
      if(res.type=='ok')
        setFolderItemTab(res.folderItemTab.filter(aRow=>
          !(aRow.fileType=='binary'&&aRow.binaryState!='ready')
        ).sort((aRow,bRow)=>
          aRow.folderItemName.localeCompare(bRow.folderItemName)
        ))
      else
        throw res
    })()
    yield
    ab.abort()
  },[me,folder,folderItemTabT])
  let enter=folderItemRow=>{
    if(folderItemRow.fileType=='binary')
      Object.assign(document.createElement("a"),{
        href:`%23downloadBinary?folderItem=${folderItemRow.folderItem}`
      }).click()
    else if(folderItemRow.fileType=='folder'){
      if(move&&folderItemRow.folderItem==movingFolderItem)
        return alert('Cannot move folder into itself.')
      goFolderPage(
        folderItemRow.folderItem,
        folderItemRow.folderItemName,
        folderItemRow.file
      )
    }else if(folderItemRow.fileType=='note')
      goNoteEditPage(folderItemRow.file)
  }
  return me?div({
    class:'folderPage',
    ref:pageRef,
    tabindex:'0',
    onkeydown:e=>{
      if(['Escape'].includes(e.key)){
        e.preventDefault()
        e.stopPropagation()
        setSelectedFolderItem(null)
      }else if(
        !e.altKey&&
        !e.ctrlKey&&
        !e.shiftKey&&
        ['ArrowDown','j'].includes(e.key)
      ){
        e.preventDefault()
        e.stopPropagation()
        if(selectedFolderItem){
          folderItemTab.map((n,i)=>{
            if(n.folderItem==selectedFolderItem&&i+1<folderItemTab.length)
              setSelectedFolderItem(folderItemTab[i+1].folderItem)
          })
        }else if(folderItemTab.length)
          setSelectedFolderItem(folderItemTab[0].folderItem)
      }else if(
        !e.altKey&&
        !e.ctrlKey&&
        !e.shiftKey&&
        ['ArrowUp','k'].includes(e.key)&&
        selectedFolderItem
      ){
        e.preventDefault()
        e.stopPropagation()
        folderItemTab.map((n,i)=>{
          if(n.folderItem==selectedFolderItem&&i-1>=0)
            setSelectedFolderItem(folderItemTab[i-1].folderItem)
        })
      }else if(
        !e.altKey&&
        !e.ctrlKey&&
        !e.shiftKey&&
        ['ArrowRight','Enter','l'].includes(e.key)&&
        selectedFolderItem
      ){
        e.preventDefault()
        e.stopPropagation()
        enter(
          folderItemTab.find(folderItemRow=>
            folderItemRow.folderItem==selectedFolderItem
          )
        )
      }
    },
    onclick:e=>{
      e.preventDefault()
      e.stopPropagation()
      setSelectedFolderItem(null)
      e.target.focus()
    },
  },
    input({
      ref:folderInputRef,
      multiple:'',
      onchange:e=>{
        console.log(e.target.files)
      },
      onclick:e=>e.stopPropagation(),
      style:{display:'none'},
      type:'file',
      webkitdirectory:'',
    }),
    div({
      class:['mainLayer',dropzone||folderItemMenu||addMenu?'blur':''].join(' '),
    },
      move?
      me.folder==folder?
        TopBar({
          title:`Move`
        })
      :
        TopBar({
          leftIcon:'\ue5c4',
          onLeftClick:goBack,
          title:`Move to ${folderItemName||''}`,
        })
      :
        TopBar(me.folder==folder?{
          leftIcon:'\ue5d2',
          onLeftClick:goSettingPage,
        }:{
          leftIcon:'\ue5c4',
          onLeftClick:goBack,
          title:folderItemName||'',
        },
          uploading?button({
            class:'right uploading material-symbols-sharp',
            onclick:goUploadTaskPage,
          },
            '\ue2c3',
          ):[],
        )
      ,
      div({
        class:'main',
        ondragenter:()=>setDropzone(1),
      },
        folderItemTab.map(folderItemRow=>
          FolderItem({
            icon:{
              folder:'\ue2c7',
              note:'\uf1fc',
              binary:'\ue66d',
            }[folderItemRow.fileType],
            onEnter:()=>enter(folderItemRow),
            onSelect:()=>setSelectedFolderItem(folderItemRow.folderItem),
            key:folderItemRow.folderItem,
            move,
            selected:folderItemRow.folderItem==selectedFolderItem,
            showMenu:()=>setFolderItemMenu(folderItemRow.folderItem),
            title:folderItemRow.folderItemName,
          })
        ),
      ),
      move?div({
        class:'bottomBar',
      },
        button({
          onclick:onCancel,
        },
          'Cancel',
        ),
        button({
          onclick:onMove,
        },
          'Move',
        ),
      ):button({
        class:'add material-symbols-sharp',
        onclick:()=>{
          setAddMenu(1)
        },
      },
        '\ue145',
      ),
    ),
    dropzone?div({
      class:'dropzone material-symbols-sharp',
      ondragleave:()=>setDropzone(),
      ondragover:e=>e.preventDefault(),
      ondrop:e=>{
        e.preventDefault()
        putBinaryArr({
          files:e.dataTransfer.files,
          folder,
          setFolderItemTabT,
        })
        setDropzone()
      },
    },
      '\ue2c3',
    ):[],
    folderItemMenu?ContextMenu({
      onClick:()=>{
        setFolderItemMenu(null)
      },
    },
      ['\ue675','Move',async()=>{
        goMoveFolderPage(me.folder,folderItemMenu)
      }],
      ['\uf88d','Rename',async()=>{
        let folderItemName=prompt(
          '',
          folderItemTab.find(folderItemRow=>
            folderItemRow.folderItem==folderItemMenu
          ).folderItemName
        )
        if(folderItemName==null)
          return
        await setFolderItemName({
          folderItem:folderItemMenu,
          folderItemName,
        })
        setFolderItemTabT(Symbol())
      }],
      ['\ue16f','Remove',async()=>{
        if(!confirm('This file will be deleted if is not referenced elsewhere after removal. Remove? '))
          return
        await cutFolderItem({
          folderItem:folderItemMenu,
        })
        setFolderItemTabT(Symbol())
      }],
    ):[],
    addMenu?ContextMenu({
      onClick:()=>{
        setAddMenu(null)
      },
    },
      ['\ue2cc','Folder',async()=>{
        await putFolder({folder})
        setFolderItemTabT(Symbol())
      }],
      ['\ue89c','Note',async()=>{
        await putNote({folder})
        setFolderItemTabT(Symbol())
      }],
      ['\ue9fc','Upload',async()=>{
        let e=await new Promise(onchange=>
          Object.assign(document.createElement('input'),{
            multiple:true,
            onchange,
            type:'file',
          }).click()
        )
        putBinaryArr({
          files:e.target.files,
          folder,
          setFolderItemTabT,
        })
      }],
      /*['\ue9a3','Upload Folder',()=>{
        folderInputRef.current.click()
      }],*/
    ):[],
  ):$tn()
})
