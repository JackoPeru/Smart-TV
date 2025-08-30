import React from 'react'
import QRCode from 'qrcode'

export default function RemoteQR(){
  const [url,setUrl] = React.useState('')
  const [data,setData] = React.useState('')
  React.useEffect(()=>{(async()=>{
    try{
      if (window.smartTV && window.smartTV.getRemoteURL) {
        const u = await window.smartTV.getRemoteURL()
        setUrl(u)
        setData(await QRCode.toDataURL(u))
      }
    }catch(e){
      // ignore in browser
    }
  })()},[])
  if(!data) return null
  return (
    <div style={{textAlign:'center'}}>
      <img src={data} width={180} height={180} />
      <div style={{opacity:.7,marginTop:8}}>{url}</div>
    </div>
  )
}