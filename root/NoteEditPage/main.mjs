import{component,dom,useEffect,useRef,useState}from 'concept'
import TopBar from        '../TopBar/main.mjs'
let{button,div,textarea}=dom
let Textarea=component(({defaultValue,ref,...prop})=>{
  ref=(newRef=>ref||newRef)(useRef())
  useEffect(()=>{
    ref.current.value=defaultValue
  },[])
  return textarea({
    ref,
    ...prop,
  })
})
let noteBodyText=noteBody=>
  (noteBody=>noteBody.type?noteBody.text:'')(JSON.parse(noteBody))
export default component(({
  cutNote,
  editingNote,
  getNoteByNote,
  goBack,
  goSettingPage,
  session:{isNew},
  setNoteBody,
})=>{
  let[noteRow,setNoteRow]=useState()
  let[firstNoteT,setFirstNoteT]=useState(Symbol())
  let[noteT,setNoteT]=useState(firstNoteT)
  let[text,setText]=useState('')
  let[wrap,setWrap]=useState(true)
  let textareaRef=useRef()
  useEffect(()=>{
    if(isNew&&firstNoteT==noteT&&textareaRef.current)
      textareaRef.current.focus()
  },[firstNoteT,isNew,noteRow,noteT])
  useEffect(function*(){
    let ab=new AbortController
    ;(async()=>{
      try{
        let res=await getNoteByNote({note:editingNote},{signal:ab.signal})
        if(ab.signal.aborted)
          throw new DOMException('','AbortError')
        if(res.type=='ok'){
          setText(noteBodyText(res.note[0].noteBody))
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
    await setNoteBody({note:editingNote,noteBody:JSON.stringify({
      type:'text',
      text,
    })})
    setNoteT(Symbol())
  }
  return div({
    class:'noteEditPage',
  },
    TopBar({
      leftIcon:'\ue5c4',
      onLeftClick:goBack,
    },
      noteRow?[
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
            text==noteBodyText(noteRow.noteBody)?'saved':'',
          ].join(' '),
          onclick:set,
        },
          '\ue161',
        ),
      ]:[],
    ),
    div({
      class:'main',
    },
      noteRow?Textarea({
        key:noteRow.note,
        ref:textareaRef,
        class:[
          'textarea',
          wrap?'wrap':'',
        ].join(' '),
        defaultValue:text,
        oninput:e=>setText(e.target.value),
        onkeydown:e=>{
          if(!(
            e.ctrlKey&&e.key.toLowerCase()=='s'
          ))
            return
          e.preventDefault()
          e.stopPropagation()
          set()
        },
      }):[],
    ),
  )
})
