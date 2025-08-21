import{$fragment,component,dom,useState}from'concept'
import TopBar from        '../TopBar/main.mjs'
let{button,div,input,option,select}=dom
let LogIn=component(({logIn})=>{
  let[username,setUsername]=useState('')
  let[password,setPassword]=useState('')
  let tryLogIn=async e=>{
    let res=await logIn(username,password)
    if(res.type=='ok'){
      setUsername('')
      setPassword('')
    }else if(res.type=='badUsername')
      alert('The username does not exist.')
    else if(res.type=='badPassword')
      alert('The password is wrong for this user.')
    else
      alert('Unknown error.')
  }
  return $fragment({},
    div({
      class:'title',
    },'Log In'),
    input({
      maxLength:16,
      oninput:e=>{setUsername(e.target.value)},
      onkeydown:e=>{if(e.key=='Enter')tryLogIn()},
      placeholder:'Username',
      value:username,
    }),
    input({
      maxLength:1024,
      oninput:e=>{setPassword(e.target.value)},
      onkeydown:e=>{if(e.key=='Enter')tryLogIn()},
      placeholder:'Password',
      type:'password',
      value:password,
    }),
    button({
      class:'typeA',
      onclick:tryLogIn,
    },'Log In'),
  )
})
let Register=component(({register})=>{
  let[username,setUsername]=useState('')
  let[password,setPassword]=useState('')
  let[confirmPassword,setConfirmPassword]=useState('')
  let tryRegister=async e=>{
    if(!(/^[0-9a-z]{1,16}$/.test(username)))
      return alert('The username should be between 1 and 16 characters long, and consist only numbers or lowercase English letters.')
    if(!(password.length<=1024))
      return alert('The password length should be less than or equal to 1024.')
    if(!(password==confirmPassword))
      return alert('The confirm password should be the same as the password.')
    let res=await register(username,password)
    if(res.type=='ok'){
      setUsername('')
      setPassword('')
      setConfirmPassword('')
    }else if(res.type=='badUsername')
      alert('The username had already been used. Please try a different username.')
    else
      alert('Unknown error.')
  }
  return $fragment({},
    div({
      class:'title',
    },'Register'),
    input({
      maxLength:16,
      oninput:e=>{setUsername(e.target.value)},
      onkeydown:e=>{if(e.key=='Enter')tryRegister()},
      placeholder:'Username',
      value:username,
    }),
    input({
      maxLength:1024,
      oninput:e=>{setPassword(e.target.value)},
      onkeydown:e=>{if(e.key=='Enter')tryRegister()},
      placeholder:'Password',
      type:'password',
      value:password,
    }),
    input({
      maxLength:1024,
      oninput:e=>{setConfirmPassword(e.target.value)},
      onkeydown:e=>{if(e.key=='Enter')tryRegister()},
      placeholder:'Confirm Password',
      type:'password',
      value:confirmPassword,
    }),
    button({
      class:'typeA',
      onclick:tryRegister,
    },'Register'),
  )
})
export default component(({
  goBack,
  logIn,
  logOut,
  me,
  register,
  style,setStyle,
})=>{
  return div({
    class:'settingPage',
  },
    TopBar({
      leftIcon:'\ue5c4',
      onLeftClick:goBack,
    }),
    div({
      class:'main',
    },
      select({
        class:'styleSelect',
        oninput:e=>setStyle(e.target.value),
        value:style,
      },
        option({value:'dark'},'Dark'),
        option({value:'light'},'Light'),
      ),
      me?[
        div({class:'title'},me.userUsername),
        button({
          class:'typeA',
          onclick:async e=>{
            let res=await logOut()
            if(res.type=='ok')
              ;
            else if(res.type=='badUsername')
              alert('Unknown error.')
          },
        },'Log Out'),
      ]:[
        LogIn({
          logIn,
        }),
        Register({
          register,
        }),
      ],
    ),
  )
})
