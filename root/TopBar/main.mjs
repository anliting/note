import{dom}from 'concept'
let{button,div}=dom
export default({
  leftIcon,onLeftClick,title,
},...child)=>div({
  class:'topBar',
},
  leftIcon?button({
    class:'left material-symbols-sharp',
    onclick:onLeftClick,
  },
    leftIcon,
  ):div({class:'leftMargin'}),
  div({class:'title'},title||''),
  ...child,
)
