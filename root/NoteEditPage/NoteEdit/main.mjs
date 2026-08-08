import{component,dom,useEffect,useRef}from 'concept'
let{div}=dom
let noteBodyText=noteBody=>
  (noteBody=>noteBody.type?noteBody.text:'')(JSON.parse(noteBody))
// By Claude
let scrollCaretIntoView=el=>{
  let sel=getSelection()
  if(!sel.rangeCount)
    return
  let r=sel.getRangeAt(0).cloneRange()
  let rect=r.getClientRects()[0]
  if(!rect){
    let probe=new Text('\u200b')
    r.insertNode(probe)
    r.selectNode(probe)
    rect=r.getClientRects()[0]
    probe.remove()
  }
  if(!rect)
    return
  let b=el.getBoundingClientRect()
  let c={
    top:b.top+el.clientTop,
    left:b.left+el.clientLeft,
  }
  c.bottom=c.top+el.clientHeight
  c.right=c.left+el.clientWidth
  if(rect.bottom>c.bottom)
    el.scrollTop+=rect.bottom-c.bottom
  else if(rect.top<c.top)
    el.scrollTop-=c.top-rect.top
  if(rect.right>c.right)
    el.scrollLeft+=rect.right-c.right
  else if(rect.left<c.left)
    el.scrollLeft-=c.left-rect.left
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
        let sel=getSelection(),r=sel.getRangeAt(0)
        let rest=document.createRange()
        rest.setStart(r.endContainer,r.endOffset)
        rest.setEnd(el,el.childNodes.length)
        if(rest.toString()=='')
          el.append('\n')
        r.deleteContents()
        let t=new Text('\n')
        r.insertNode(t)
        r.setStartAfter(t)
        r.collapse(true)
        sel.removeAllRanges()
        sel.addRange(r)
        scrollCaretIntoView(el)
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
      if(!text)
        return
      let el=e.currentTarget
      let sel=getSelection(),r=sel.getRangeAt(0)
      let rest=document.createRange()
      rest.setStart(r.endContainer,r.endOffset)
      rest.setEnd(el,el.childNodes.length)
      if(rest.toString()=='')
        el.append('\n')
      r.deleteContents()
      let t=new Text(text)
      r.insertNode(t)
      r.setStartAfter(t)
      r.collapse(true)
      sel.removeAllRanges()
      sel.addRange(r)
      scrollCaretIntoView(el)
      e.target.dispatchEvent(new InputEvent('input',{
        bubbles:true,
        data:text,
        inputType:'insertFromPaste',
      }))
    },
    ...prop,
  })
})
