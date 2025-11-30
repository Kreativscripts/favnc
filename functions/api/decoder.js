export async function onRequest({ request }) {
  const u=new URL(request.url)
  const txt=u.searchParams.get("txt")
  const mode=(u.searchParams.get("mode")||"auto").toLowerCase()
  if(!txt)return j({error:"txt required"},400)

  const modes=new Set(["auto","url","html","js","b64"])
  if(!modes.has(mode))return j({error:"mode must be auto,url,html,js,b64"},400)

  const decUrl=v=>{try{return decodeURIComponent(v.replace(/\+/g," "))}catch(_){return null}}
  const decHtml=v=>{
    if(!v.includes("&"))return null
    return v.replace(/&(#\d+|#x[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g,(m,g)=>{
      if(g==="amp")return"&"
      if(g==="lt")return"<"
      if(g==="gt")return">"
      if(g==="quot")return'"'
      if(g==="apos")return"'"
      if(g[0]==="#"&&g[1]==="x")return String.fromCharCode(parseInt(g.slice(2),16))
      if(g[0]==="#")return String.fromCharCode(parseInt(g.slice(1),10))
      return m
    })
  }
  const decJs=v=>{
    try{return JSON.parse('"'+v.replace(/\\/g,"\\\\").replace(/"/g,'\\"')+'"')}catch(_){return null}
  }
  const decB64=v=>{
    try{return atob(v)}catch(_){return null}
  }

  let resolved=mode,text
  if(mode==="url")text=decUrl(txt)||"Invalid URL encoding"
  else if(mode==="html")text=decHtml(txt)||"Invalid HTML entities"
  else if(mode==="js")text=decJs(txt)||"Invalid JS/JSON escape string"
  else if(mode==="b64")text=decB64(txt)||"Invalid Base64"
  else{
    const chain=[["url",decUrl],["html",decHtml],["js",decJs],["b64",decB64]]
    text=txt
    resolved="auto"
    for(const [name,fn] of chain){
      const r=fn(txt)
      if(r&&r!==txt){text=r;resolved=name;break}
    }
  }

  return j({input:txt,mode,resolvedMode:resolved,text},200)
}

function j(b,s){return new Response(JSON.stringify(b),{status:s,headers:{"content-type":"application/json"}})}
