import{
  component,dom,useEffect,useRef
}from'concept'
let{button,div}=dom
export default component(({
  icon,
  onEnter,
  onSelect,
  move,
  selected,
  showMenu,
  title,
})=>{
  let ref=useRef()
  useEffect(()=>{
    if(selected)
      ref.current.scrollIntoView({
        block:'nearest',
        inline:'nearest',
      })
  },[selected])
  return div({
    class:['folderItem',selected?'selected':''].join(' '),
    onclick:e=>{
      if(matchMedia('(pointer:coarse)').matches){
        e.preventDefault()
        e.stopPropagation()
        return onEnter()
      }
      if(matchMedia('(pointer:fine)').matches){
        e.preventDefault()
        e.stopPropagation()
        return onSelect()
      }
    },
    ondblclick:e=>{
      if(!(
        matchMedia('(pointer:fine)').matches
      ))
        return
      e.preventDefault()
      e.stopPropagation()
      onEnter()
    },
    ref,
  },
    div({class:'icon material-symbols-sharp',},icon),
    div({
      class:'title',
    },
      title
    ),
    move?[]:button({
      class:'right material-symbols-sharp',
      onclick:e=>{
        e.preventDefault()
        e.stopPropagation()
        onSelect()
        showMenu()
      },
      ondblclick:e=>{
        e.preventDefault()
        e.stopPropagation()
      },
    },
      '\ue5d4'
    ),
  )
})
