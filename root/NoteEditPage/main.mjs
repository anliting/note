import{component,dom,useEffect,useRef,useState}from 'concept'
import NoteEdit from      './NoteEdit/main.mjs'
import TopBar from        '../TopBar/main.mjs'
let{button,div}=dom
export default component(({
  cutNote,
  editingNote,
  getNoteByNote,
  goBack,
  goSettingPage,
  session:{isNew},
  setNoteBody,
})=>{
  let firstNoteT=useState(Symbol())[0]
  let[noteT,setNoteT]=useState(firstNoteT)
  let[noteRow,setNoteRow]=useState()
  let[wrap,setWrap]=useState(true)
  let[dirty,setDirty]=useState(false)
  let noteEditRef=useRef()
  useEffect(()=>{
    if(isNew&&firstNoteT==noteT&&noteEditRef.current)
      noteEditRef.current.focus()
  },[firstNoteT,isNew,noteRow,noteT])
  useEffect(function*(){
    let ab=new AbortController
    ;(async()=>{
      try{
        let res=await getNoteByNote({note:editingNote},{signal:ab.signal})
        if(ab.signal.aborted)
          throw new DOMException('','AbortError')
        if(res.type=='ok'){
          setDirty(false)
          setNoteRow(res.note[0])
        }else
          throw res
      }catch(e){
        if(e?.name=='AbortError')
          return
        throw e
      }
    })()
    yield
    ab.abort()
  },[noteT])
  let set=async()=>{
    await setNoteBody({
      note:editingNote,
      noteBody:noteEditRef.current?
        noteEditRef.current.value
      :
        noteRow.noteBody
    })
    setNoteT(Symbol())
    setDirty(false)
  }
  return div({
    class:'noteEditPage',
  },
    TopBar({
      leftIcon:'\ue2ea',
      onLeftClick:goBack,
    },
      !!noteRow&&[
        button({
          class:[
            'wrap',
            'material-symbols-sharp',
            wrap?'on':'off',
          ].join(' '),
          onclick:()=>setWrap(!wrap),
        },
          '\ue25b',
        ),
        button({
          class:'delete material-symbols-sharp',
          onclick:async()=>{
            if(!confirm('Delete?'))
              return
            await cutNote({note:editingNote})
            goBack()
          },
        },
          '\ue872',
        ),
        button({
          class:[
            'save',
            'material-symbols-sharp',
            dirty?'':'saved',
          ].join(' '),
          onclick:set,
        },
          '\ue161',
        ),
      ],
    ),
    div({
      class:'main',
    },
      !!noteRow&&NoteEdit({
        key:noteRow.note,
        ref:noteEditRef,
        class:[
          'noteEdit',
          wrap?'wrap':'',
        ].join(' '),
        defaultValue:noteRow.noteBody,
        oninput:()=>setDirty(true),
        onkeydown:e=>{
          if(!(
            e.ctrlKey&&e.key.toLowerCase()=='s'
          ))
            return
          e.preventDefault()
          e.stopPropagation()
          set()
        },
      }),
    ),
  )
})
