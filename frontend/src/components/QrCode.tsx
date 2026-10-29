import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

/** QR que abre la pantalla de la cafetera en la dirección actual de la app (ruta con #, para GitHub Pages). */
export default function QrCode({ code }: { code: string }) {
  const url = `${window.location.origin}${window.location.pathname}#/m/${code}`
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(url, { margin: 2, width: 260, color: { dark: '#2b2e48', light: '#ffffff' } })
      .then((d) => alive && setSrc(d))
      .catch(() => alive && setSrc(null))
    return () => {
      alive = false
    }
  }, [url])

  return (
    <figure className="qr-box">
      {src ? <img src={src} width={260} height={260} alt={`Código QR de la cafetera ${code}`} /> : <p>Generando QR…</p>}
      <figcaption>
        <strong>{code}</strong>
        <br />
        <span className="small">{url}</span>
      </figcaption>
      {src && <a className="btn secondary compact" href={src} download={`cafetera-${code}.png`}>Descargar QR</a>}
    </figure>
  )
}
