import{component,dom}from 'concept'
import TopBar from        '../TopBar/main.mjs'
let{div}=dom
export default component(({
  goSettingPage,
})=>{
  return div({
    class:'rootPage',
  },
    div({
      class:['mainLayer'].join(' '),
    },
      TopBar({
        leftIcon:'\ue5d2',
        onLeftClick:goSettingPage,
      }),
      div({
        class:'main',
      },
      ),
    ),
  )
})
