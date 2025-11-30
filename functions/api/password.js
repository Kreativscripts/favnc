export async function onRequest({ request }) {
  const u=new URL(request.url)
  let len=parseInt(u.searchParams.get("length")||"16",10)
  const format=(u.searchParams.get("format")||"json").toLowerCase()
  if(isNaN(len))len=16
  if(len<5)len=5
  if(len>100)len=100

  const charset="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.<>?/"
  const buf=new Uint32Array(len)
  crypto.getRandomValues(buf)
  let out=""
  for(let i=0;i<len;i++)out+=charset[buf[i]%charset.length]

  if(format==="text"){
    return new Response(out,{status:200,headers:{"content-type":"text/plain; charset=utf-8"}})
  }
  return j({password:out,length:len},200)
}

function j(b,s){
  return new Response(JSON.stringify(b),{
    status:s,
    headers:{"content-type":"application/json; charset=utf-8"}
  })
}
