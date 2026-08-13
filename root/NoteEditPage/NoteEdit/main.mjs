let noteBodyText=noteBody=>
  (noteBody=>noteBody.type=='list'?
    noteBody.list.map(item=>item.text).join('')
  :
    ''
  )(JSON.parse(noteBody))
let scrollCaretIntoView=()=>{
  let sel=getSelection()
  if(!sel.rangeCount)
    return
  let r=sel.getRangeAt(0).cloneRange()
  let probe=document.createElement('span')
  probe.style.cssText='display:inline-block;width:0;height:1lh;vertical-align:top'
  r.insertNode(probe)
  probe.scrollIntoView({block:'nearest',inline:'nearest'})
  probe.remove()
}
let offsetOf=(editor,node,offset)=>{
  let r=document.createRange()
  r.setStart(editor,0)
  r.setEnd(node,offset)
  return r.toString().length
}
let caretTo=(editor,offset)=>{
  let r=document.createRange()
  let walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT)
  let node
  while(node=walker.nextNode()){
    if(offset<=node.length){
      r.setStart(node,offset)
      break
    }
    offset-=node.length
  }
  if(!node)
    r.setStart(editor,editor.childNodes.length)
  r.collapse(true)
  let sel=getSelection()
  sel.removeAllRanges()
  sel.addRange(r)
}
export default class{
  #caret=0
  #editor
  #text
  #wrap=true
  #wrapButton
  #apply(start,end,str,compensate){
    let t=this.#text
    if(compensate&&t.slice(end)=='')
      t+='\n'
    this.#text=t.slice(0,start)+str+t.slice(end)
    this.#caret=start+str.length
    this.#render()
    caretTo(this.#editor,this.#caret)
    scrollCaretIntoView()
  }
  #render(){
    if(this.#editor.textContent!=this.#text)
      this.#editor.textContent=this.#text
    this.#editor.classList.toggle('wrap',this.#wrap)
    this.#wrapButton.classList.toggle('off',!this.#wrap)
  }
  constructor(noteBody){
    this.node=document.createElement('div')
    this.node.className='noteEdit'
    this.#text=noteBodyText(noteBody)
    this.#editor=this.node.appendChild(document.createElement('div'))
    this.#editor.className='editor'
    this.#editor.contentEditable='true'
    this.#editor.tabIndex=-1
    this.#editor.onbeforeinput=e=>{
      if(e.isComposing)
        return
      e.preventDefault()
      let str
      if(['insertText','insertReplacementText'].includes(e.inputType))
        str=e.data??''
      else if(['insertParagraph','insertLineBreak'].includes(e.inputType))
        str='\n'
      else if(e.inputType=='insertFromPaste')
        str=e.dataTransfer.getData('text/plain').replace(/\r\n?/g,'\n')
      else if(e.inputType.startsWith('delete'))
        str=''
      else
        return
      let sel=getSelection()
      let r=e.getTargetRanges()[0]??(sel.rangeCount?sel.getRangeAt(0):null)
      if(!r)
        return
      let start=offsetOf(this.#editor,r.startContainer,r.startOffset)
      let end=offsetOf(this.#editor,r.endContainer,r.endOffset)
      if(str==''&&start==end)
        return
      this.#apply(start,end,str,
        ['insertParagraph','insertLineBreak','insertFromPaste'].includes(e.inputType))
      e.target.dispatchEvent(new InputEvent('input',{
        bubbles:true,
        data:str||null,
        inputType:e.inputType,
      }))
    }
    this.#editor.oncompositionend=()=>{
      this.#text=this.#editor.textContent
    }
    let toolBar=this.node.appendChild(document.createElement('div'))
    toolBar.className='toolBar'
    this.#wrapButton=toolBar.appendChild(document.createElement('button'))
    this.#wrapButton.className='wrap material-symbols-sharp'
    this.#wrapButton.textContent='\ue25b'
    this.#wrapButton.onmousedown=e=>e.preventDefault()
    this.#wrapButton.onclick=()=>{
      this.#wrap=!this.#wrap
      this.#render()
    }
    this.#render()
  }
  focus(){
    this.#editor.focus()
  }
  get value(){
    return JSON.stringify({
      type:'list',
      list:[{
        type:'text',
        text:this.#text,
      }],
    })
  }
}
