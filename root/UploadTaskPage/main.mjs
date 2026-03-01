import{
  $tn,component,dom,useRef,
}from'concept'
import TopBar from          '../TopBar/main.mjs'
import UploadTaskItem from  './UploadTaskItem/main.mjs'
let{button,div,input}=dom
export default component(({
  goBack,
  me,
  uploadTask,
})=>{
  let weakMap=useRef(new WeakMap)
  return me?div({
    class:'uploadTaskPage',
  },
    TopBar({
      leftIcon:'\ue5c4',
      onLeftClick:goBack,
      title:`Upload Tasks${uploadTask.length?` (${uploadTask.length})`:''}`,
    }),
    div({
      class:'main',
    },
      uploadTask.map(uploadTask=>
        UploadTaskItem({
          icon:'\ue9fc',
          key:weakMap.current.getOrInsert(uploadTask,Symbol()),
          title:uploadTask.file.name,
          loaded:uploadTask.loaded,
          total:uploadTask.total,
        })
      ),
    ),
  ):$tn()
})
