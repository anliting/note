import{
  component,dom
}from'concept'
let{button,div}=dom
export default component(({
  icon,
  title,
  loaded,
  total,
})=>{
  return div({
    class:'uploadTaskItem',
  },
    div({class:'icon material-symbols-sharp'},icon),
    div({class:'uploadTaskItemMain'},
      div({class:'title'},
        title,
      ),
      div({class:'progress'},
        `${loaded} / ${total} (${
          (Math.floor(10000*loaded/total)/100).toFixed(2)
        }%)`,
      ),
      div({class:'progressBar'},
        div({
          class:'loaded',
          style:{
            transform:`scaleX(${loaded/total})`,
          },
        }),
      ),
    ),
  )
})
