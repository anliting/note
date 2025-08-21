import base from          '../base/main.mjs'
import{getSessionKey}from '../user/main.mjs'
let apiMap={}
apiMap.cutFolderItem=getSessionKey(async({db,message,reply,sk})=>{
  if(!(
    base.isInt64String(message.folderItem)
  ))
    return reply({type:'badMessage'})
  reply({type:(await db.pool.query(`
    delete from"folderItem"
    using"session"natural join"file"
    where
      "folderItem"=$2 and
      "sessionKey"=$1 and
      "folder"="file"."file"
  `,[
    sk,
    message.folderItem,
  ])).rowCount?'ok':'bad'})
})
apiMap.getFolderItemTabByFolder=getSessionKey(async({
  db,message,reply,sk
})=>{
  if(!(
    base.isInt64String(message.folder)
  ))
    return reply({type:'badMessage'})
  reply({
    type:'ok',
    folderItemTab:(await db.pool.query(`
      select
        "folderItem",
        "folderItemName",
        "folderItem"."file",
        "itemFile"."fileType",
        "binary"."binaryState"
      from"session"
      natural join"file"
      join"folderItem"on"file"."file"="folderItem"."folder"
      join"file" "itemFile"on"folderItem"."file"="itemFile"."file"
      left join"binary"on"itemFile"."file"="binary"."binary"
      where"sessionKey"=$1 and"folderItem"."folder"=$2
    `,[sk,message.folder])).rows
  },200)
})
apiMap.putFolder=getSessionKey(async({db,message,reply,sk})=>{
  if(!(
    base.isInt64String(message.folder)
  ))
    return reply({type:'badMessage'})
  let res=await db.pool.query(`
    with
    "a"as(
      insert into"file"("user","fileType")
      select"user",'folder'
      from"session"
      where"sessionKey"=$1
      returning"file"
    ),
    "b"as(
      insert into"folderItem"("folder","folderItemName","file")
      select"file"."file",'',"a"."file"
      from"session"natural join"file","a"
      where"sessionKey"=$1 and"file"."file"=$2 and"file"."fileType"='folder'
    )
    insert into"folder"("folder")
    select"file"
    from"a"
    returning"folder"
  `,[sk,message.folder])
  reply({type:'ok',folderTab:res.rows})
})
apiMap.setFolderItemFolder=getSessionKey(async({db,message,reply,sk})=>{
  if(!(
    base.isInt64String(message.folderItem)&&
    base.isInt64String(message.folder)
  ))
    return reply({type:'badMessage'})
  await db.pool.query(`
    update"folderItem"
    set"folder"=$3
    from"session"
    natural join"file" "old"
    join"file" "new"using("user")
    where
      "folderItem"=$2 and
      "sessionKey"=$1 and
      "folder"="old"."file"and
      "new"."file"=$3 and
      "new"."fileType"='folder'
  `,[
    sk,
    message.folderItem,
    message.folder,
  ])
  reply({type:'ok'})
})
apiMap.setFolderItemName=getSessionKey(async({db,message,reply,sk})=>{
  if(!(
    base.isInt64String(message.folderItem)&&
    typeof message.folderItemName=='string'
  ))
    return reply({type:'badMessage'})
  reply({type:(await db.pool.query(`
    update"folderItem"
    set"folderItemName"=$3
    from"session"natural join"file"
    where
      "folderItem"=$2 and
      "sessionKey"=$1 and
      "folder"="file"."file"
  `,[
    sk,
    message.folderItem,
    message.folderItemName,
  ])).rowCount?'ok':'bad'})
})
export{apiMap}
