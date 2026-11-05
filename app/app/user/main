import argon2 from    'argon2'
import crypto from    'crypto'
let parseCookieString=s=>{
  let p={}
  s.split('; ').forEach(s=>{
    let[m,k,v0,v1]=s.match(/([^=]+)=(?:([^"]*)|"([^"]*)")/)
    ;(p[k]=p[k]||[]).push(v0!=null?v0:v1)
  })
  return p
}
let sessionKeyOfCookie=p=>{
  if(!(
    p.session?.length==1
  ))
    throw SyntaxError()
  try{
    return Buffer.from(p.session[0],'base64')
  }catch{
    throw SyntaxError()
  }
}
let getSessionKey=f=>async a=>{
  let{reply,rq}=a
  if(rq.headers.cookie)
    try{
      a.sk=sessionKeyOfCookie(parseCookieString(rq.headers.cookie))
    }catch{
      return reply('',400)
    }
  else
    a.sk=null
  await f(a)
}
let apiMap={}
apiMap.getMe=getSessionKey(async({db,reply,rq,sk})=>{
  reply({type:'ok',meRow:(await db.pool.query(`
    select"user","userUsername","folder"
    from"user"
    natural join"session"
    where"sessionKey"=$1
  `,[
    sk,
  ])).rows[0]})
})
apiMap.logIn=async({db,message,reply})=>{
  if(!(
    typeof message.username=='string'&&
    message.username.length<=16&&
    typeof message.password=='string'&&
    message.password.length<=1024
  ))
    return reply({type:'badMessage'})
  let user
  {
    let res=await db.pool.query(`
      select"user","userPassword"
      from"user"
      where"userUsername"=$1
    `,[
      message.username,
    ])
    if(!res.rows.length)
      return reply({type:'badUsername'})
    if(!await argon2.verify(res.rows[0].userPassword,message.password))
      return reply({type:'badPassword'})
    user=res.rows[0].user
  }
  let key=crypto.randomBytes(32)
  await db.pool.query(`
    insert into"session"("sessionKey","user")
    values($1,$2)
  `,[
    key,
    user,
  ])
  reply({type:'ok'},200,{
    'set-cookie':`session=${
      key.toString('base64')
    };httponly;max-age=2147483647;path=/;samesite=strict;secure`,
  })
}
apiMap.logOut=getSessionKey(async({db,reply,rq,sk})=>{
  await db.pool.query(`
    delete from"session"
    where"sessionKey"=$1
  `,[
    sk,
  ])
  reply({type:'ok'},200,{
    'set-cookie':`session=;max-age=0;path=/`,
  })
})
apiMap.putUser=async({db,message,reply})=>{
  if(!(
    typeof message.username=='string'&&
    /^[0-9a-z]{1,16}$/.test(message.username)&&
    typeof message.password=='string'&&
    message.password.length<=1024
  ))
    return reply({type:'badMessage'})
  let user
  try{
    user=(await db.pool.query(`
      with
      "a"as(
        insert into"user"("userUsername","userPassword","folder")
        values($1,$2,nextval('serial'))
        returning"user","folder"
      ),
      "b"as(
        insert into"file"("file","user","fileType")
        select"folder","user",'folder'from"a"
      ),
      "c"as(
        insert into"folder"("folder")
        select"folder"from"a"
      )
      select"user"from"a"
    `,[
      message.username,
      await argon2.hash(message.password),
    ])).rows[0].user
  }catch(e){
    if(e.code=='23505')
      return reply({type:'badUsername'})
    throw e
  }
  let key=crypto.randomBytes(32)
  await db.pool.query(`
    insert into"session"("sessionKey","user")
    values($1,$2)
  `,[
    key,
    user,
  ])
  reply({type:'ok',user},200,{
    'set-cookie':`session=${
      key.toString('base64')
    };httponly;max-age=2147483647;path=/;samesite=strict;secure`,
  })
}
export{apiMap,getSessionKey}
