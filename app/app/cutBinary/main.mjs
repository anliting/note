import fs from              'fs'
export default async({db},binary)=>{
  await db.pool.query(`
    update"binary"
    set"binaryState"='deleting'
    where"binary"=$1
  `,[binary])
  try{
    await fs.promises.unlink(`bin/${binary}`)
  }catch(e){
    if(!(e.code=='ENOENT'))
      throw e
  }
  await db.pool.query(`
    delete from"file"
    where"file"=$1
  `,[binary])
  }
