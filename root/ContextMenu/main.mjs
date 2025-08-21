import{dom}from 'concept'
let{div,span}=dom
export default({onClick,},...child)=>div({
  class:'contextMenu',
  onclick:onClick,
},
  div(
    ...child.map(([icon,text,onclick])=>
      div({onclick},
        span({class:'material-symbols-sharp'},icon),
        text,
      )
    ),
  ),
)

