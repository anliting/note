import{dom}from 'concept'
let{button,div}=dom
export default({
  leftIcon,onLeftClick,onSettingClick,title,
},...child)=>div({
  class:'topBar',
},
  leftIcon?button({
    class:'left material-symbols-sharp',
    onclick:onLeftClick,
  },
    leftIcon,
  ):div({class:'leftMargin'}),
  div({class:'title'},
    div(
      title||''
    ),
  ),
  child,
  onSettingClick&&button({
    class:'right setting material-symbols-sharp',
    onclick:onSettingClick,
  },
    '\ue8b8',
  ),
)
