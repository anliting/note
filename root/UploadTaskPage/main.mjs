import{
  $tn,component,dom,useRef,
}from'concept'
import TopBar from          '../TopBar/main.mjs'
import UploadTaskItem from  './UploadTaskItem/main.mjs'
let{button,div,input}=dom
export default component(({
  cutTask,
  goBack,
  me,
  uploadTask,
})=>{
  /*uploadTask=[...uploadTask,{
    file:{
      name:'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    },
    loaded:60*1e12,
    total:100*1e12,
  }]*/
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
          cutTask:()=>{
            cutTask(uploadTask)
          },
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
