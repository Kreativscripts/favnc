export async function onRequest({ request }) {
  const u=new URL(request.url)
  const txt=u.searchParams.get("txt")
  const base=u.searchParams.get("base")

  if (!txt && !base)
    return j({error:"use ?txt= or ?base="},400)

  if (txt) {
    const b=btoa(txt)
    return j({base:b,input:txt},200)
  }

  try {
    const d=atob(base)
    return j({text:d,input:base},200)
  } catch(e) {
    return j({error:"invalid base64"},400)
  }
}

function j(b,s){
  return new Response(JSON.stringify(b),{
    status:s,
    headers:{"content-type":"application/json"}
  })
}
