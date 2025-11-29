export async function onRequest({ request }) {
  const url = new URL(request.url)
  const unix = url.searchParams.get("unix")
  const date = url.searchParams.get("date")
  const time = url.searchParams.get("time")
  const style = (url.searchParams.get("style") || "R").toUpperCase()
  const format = (url.searchParams.get("format") || "json").toLowerCase()

  const okStyles = new Set(["T","t","D","d","F","f","R"])
  if (!okStyles.has(style)) {
    return json({error:"invalid style, use one of t,T,d,D,f,F,R"},400)
  }

  let ts
  if (unix) {
    let n = Number(unix)
    if (!Number.isFinite(n)) return json({error:"unix must be a number"},400)
    if (n > 1e12) n = Math.floor(n/1000)
    ts = Math.floor(n)
  } else {
    if (!date || !time) {
      return json({error:"provide unix OR date+time"},400)
    }
    const iso = `${date}T${time}`
    const d = new Date(iso)
    if (isNaN(d.getTime())) return json({error:"invalid date or time"},400)
    ts = Math.floor(d.getTime()/1000)
  }

  const code = `<t:${ts}:${style}>`
  if (format === "text") {
    return new Response(code,{status:200,headers:{"content-type":"text/plain; charset=utf-8"}})
  }
  return json({code,unix:ts,style},200)
}

function json(body,status) {
  return new Response(JSON.stringify(body),{
    status,
    headers:{"content-type":"application/json; charset=utf-8"}
  })
}
