import{
  component,dom
}from'concept'
let{button,div}=dom
let toFixed2=a=>(~~(100*a)/100).toFixed(2)
let toFixed2B=a=>{
  let b=~~(Math.log(a)/Math.log(1024))
  return toFixed2(a/1024**b)+['B','KiB','MiB','GiB','TiB'][b]
}
export default component(({
  cutTask,
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
        `${toFixed2B(loaded)} / ${toFixed2B(total)} (${
          (~~(10000*loaded/total)/100).toFixed(2)
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
    button({
      class:'right material-symbols-sharp',
      onclick:cutTask,
    },
      '\uf508',
    )
  )
})
