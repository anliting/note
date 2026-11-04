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
        onSettingClick:goSettingPage,
      }),
      div({
        class:'main',
      },
      ),
    ),
  )
})
