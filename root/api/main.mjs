let api=new Proxy({},{
  get:(o,f)=>async(a,{signal}={})=>(await fetch('/%23api',{
    signal,
    method:'POST',
    body:JSON.stringify({
      function:f,
      argument:a,
    }),
  })).json()
})
export{api}
