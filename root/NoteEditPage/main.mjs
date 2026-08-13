import{component,dom,useEffect,useMemo,useRef,useState}from 'concept'
import TopBar from        '../TopBar/main.mjs'
import NoteEdit from      './NoteEdit/main.mjs'
let{button,div}=dom
let NoteEditPage=component(({
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
  let[dirty,setDirty]=useState(false)
  let mainRef=useRef()
  let noteEdit=useMemo(
    ()=>noteRow&&new NoteEdit(noteRow.noteBody),
    [noteRow&&noteRow.note],
  )
  let set=async()=>{
    await setNoteBody({
      note:editingNote,
      noteBody:noteEdit.value,
    })
    setNoteT(Symbol())
    setDirty(false)
  }
  useEffect(function*(){
    if(!noteEdit)
      return yield
    noteEdit.node.oninput=()=>setDirty(true)
    mainRef.current.appendChild(noteEdit.node)
    yield
    mainRef.current.removeChild(noteEdit.node)
  },[noteEdit])
  useEffect(()=>{
    if(isNew&&firstNoteT==noteT&&noteEdit)
      noteEdit.focus()
  },[firstNoteT,isNew,noteEdit,noteT])
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
  return div({
    class:'noteEditPage',
    onkeydown:e=>{
      if(!(
        e.ctrlKey&&e.key.toLowerCase()=='s'
      ))
        return
      e.preventDefault()
      e.stopPropagation()
      if(noteEdit)
        set()
    },
  },
    TopBar({
      leftIcon:'\ue2ea',
      onLeftClick:goBack,
    },
      !!noteRow&&[
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
          onmousedown:e=>e.preventDefault(),
          onclick:set,
        },
          '\ue161',
        ),
      ],
    ),
    div({
      class:'main',
      ref:mainRef,
    }),
  )
})
export default component(prop=>[NoteEditPage({...prop,key:prop.editingNote})])
