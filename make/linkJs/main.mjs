import{rollup}from'rollup'
export default async input=>(await(await rollup({
  input,
  plugins:[{
    resolveId:i=>
      i=='concept'?'concept/build/main.mjs':null,
  }],
})).generate({
})).output[0].code
