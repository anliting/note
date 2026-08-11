import{component,dom,useEffect,useRef}from 'concept'
let{div}=dom
let noteBodyText=noteBody=>
  (noteBody=>noteBody.type?noteBody.text:'')(JSON.parse(noteBody))
let scrollCaretIntoView=()=>{
  let sel=getSelection()
  if(!sel.rangeCount)
    return
  let r=sel.getRangeAt(0).cloneRange()
  let probe=document.createElement('span')
  r.insertNode(probe)
  probe.scrollIntoView({block:'nearest',inline:'nearest'})
  probe.remove()
}
let normalizeTrailingNewline=el=>{
  let r=getSelection().getRangeAt(0)
  let rest=document.createRange()
  rest.setStart(r.endContainer,r.endOffset)
  rest.setEnd(el,el.childNodes.length)
  if(rest.toString()=='')
    el.append('\n')
}
let replaceSelection=text=>{
  let sel=getSelection(),r=sel.getRangeAt(0)
  r.deleteContents()
  let t=new Text(text)
  r.insertNode(t)
  r.setStartAfter(t)
  r.collapse(true)
  sel.removeAllRanges()
  sel.addRange(r)
}
export default component(({defaultValue,ref,...prop})=>{
  let divRef=useRef()
  ref=(newRef=>ref||newRef)(useRef())
  ref.current={
    focus(){
      if(divRef.current)
        divRef.current.focus()
    },
    get value(){
      return divRef.current?JSON.stringify({
        type:'text',
        text:divRef.current.textContent,
      }):defaultValue
    },
  }
  useEffect(()=>{
    divRef.current.textContent=noteBodyText(defaultValue)
  },[])
  return div({
    ref:divRef,
    contenteditable:'true',
    tabindex:'-1',
    onbeforeinput:e=>{
      if(['insertParagraph','insertLineBreak'].includes(e.inputType)){
        e.preventDefault()
        let el=e.currentTarget
        normalizeTrailingNewline(el)
        replaceSelection('\n')
        scrollCaretIntoView()
        e.target.dispatchEvent(new InputEvent('input',{
          bubbles:true,
          data:'\n',
          inputType:'insertText',
        }))
      }
    },
    onpaste:e=>{
      e.preventDefault()
      let text=e.clipboardData.getData('text/plain').replace(/\r\n?/g,'\n')
      if(text){
        let el=e.currentTarget
        normalizeTrailingNewline(el)
        replaceSelection(text)
        scrollCaretIntoView()
        e.target.dispatchEvent(new InputEvent('input',{
          bubbles:true,
          data:text,
          inputType:'insertFromPaste',
        }))
      }
    },
    ...prop,
  })
})
