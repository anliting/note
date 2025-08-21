export default class{
  #map=[]
  _set=new Set
  add(a){
    for(let[f,m]of this.#map){
      let key=f(a),c=m.get(key)
      if(!c)
        m.set(key,c=new Set)
      c.add(a)
    }
    this._set.add(a)
    return this
  }
  delete(a){
    for(let[f,m]of this.#map){
      let key=f(a),c=m.get(key)
      if(c){
        c.delete(a)
        if(!c.size)
          m.delete(key)
      }
    }
    return this._set.delete(a)
  }
  map(f){
    let m=new Map
    this.#map.push([f,m])
    return a=>m.get(a)??new Set
  }
  set(a,f){
    this.delete(a)
    f(a)
    this.add(a)
  }
  get size(){
    return this._set.size
  }
  [Symbol.iterator](){
    return this._set[Symbol.iterator]()
  }
}
