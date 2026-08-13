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
export default class{
  #editor
  #wrap=true
  #wrapButton
  #render(){
    this.#editor.classList.toggle('wrap',this.#wrap)
    this.#wrapButton.classList.toggle('off',!this.#wrap)
  }
  constructor(noteBody){
    this.element=document.createElement('div')
    this.element.className='noteEdit'
    let el=this.#editor=this.element.appendChild(document.createElement('div'))
    el.className='editor'
    el.contentEditable='true'
    el.tabIndex=-1
    el.textContent=noteBodyText(noteBody)
    el.onbeforeinput=e=>{
      if(['insertParagraph','insertLineBreak'].includes(e.inputType)){
        e.preventDefault()
        normalizeTrailingNewline(el)
        replaceSelection('\n')
        scrollCaretIntoView()
        e.target.dispatchEvent(new InputEvent('input',{
          bubbles:true,
          data:'\n',
          inputType:'insertText',
        }))
      }
    }
    el.onpaste=e=>{
      e.preventDefault()
      let text=e.clipboardData.getData('text/plain').replace(/\r\n?/g,'\n')
      if(text){
        normalizeTrailingNewline(el)
        replaceSelection(text)
        scrollCaretIntoView()
        e.target.dispatchEvent(new InputEvent('input',{
          bubbles:true,
          data:text,
          inputType:'insertFromPaste',
        }))
      }
    }
    let toolBar=this.element.appendChild(document.createElement('div'))
    toolBar.className='toolBar'
    let wrapButton=this.#wrapButton=toolBar.appendChild(document.createElement('button'))
    wrapButton.className='wrap material-symbols-sharp'
    wrapButton.textContent='\ue25b'
    wrapButton.onmousedown=e=>e.preventDefault()
    wrapButton.onclick=()=>{
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
        text:this.#editor.textContent,
      }],
    })
  }
}
