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
  error,
  icon,
  retryTask,
  title,
  loaded,
  total,
})=>{
  return div({
    class:['uploadTaskItem',...error?['error']:[]].join(' '),
  },
    div({class:'icon material-symbols-sharp'},icon),
    div({class:'uploadTaskItemMain'},
      div({class:'title'},
        title,
      ),
      error?
        div({class:'error'},
          error,
        ):
        div({class:'progress'},
          div({class:'left'},
            toFixed2B(loaded),
          ),
          div({class:'right'},
            `${
              (~~(10000*loaded/total)/100).toFixed(2)
            }%\u00a0${toFixed2B(total)}`,
          ),
        ),
      div({class:'progressBar'},
        div({
          class:'loaded',
          style:{
            transform:`scaleX(${error?1:loaded/total})`,
          },
        }),
      ),
    ),
    error&&button({
      class:'right material-symbols-sharp',
      onclick:retryTask,
    },
      '\ue5d5',
    ),
    button({
      class:'right material-symbols-sharp',
      onclick:cutTask,
    },
      '\uf508',
    )
  )
})
