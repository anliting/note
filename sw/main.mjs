let rqPromise=rq=>new Promise((rs,rj)=>{
  rq.onsuccess=rs
  rq.onerror=rj
})
let dbPromise=(async()=>(await rqPromise(Object.assign(indexedDB.open('',3),{
  onupgradeneeded:async e=>{
    let db=e.target.result
    if(e.oldVersion<1){
      let setting=db.createObjectStore('setting')
      await rqPromise(setting.add('dark','style'))
    }
    if(e.oldVersion<2){
      db.createObjectStore('note')
    }
    if(e.oldVersion<3){
      db.deleteObjectStore('note')
    }
  },
}))).target.result)()
let messageTypeMap={}
messageTypeMap.getStyle=async e=>e.source.postMessage({
  type:'setStyle',
  style:(await rqPromise(
    (await dbPromise).
    transaction(['setting']).
    objectStore('setting').
    get('style')
  )).target.result,
})
messageTypeMap.setStyle=async e=>{
  await rqPromise(
    (await dbPromise).
    transaction(['setting'],'readwrite').
    objectStore('setting').
    put(e.data.style,'style')
  )
  for(let client of await clients.matchAll())
    client.postMessage({
      type:'setStyle',
      style:e.data.style,
    })
}
addEventListener('message',e=>e.waitUntil(messageTypeMap[e.data.type](e)))
