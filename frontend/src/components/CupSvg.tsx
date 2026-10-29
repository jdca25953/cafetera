import { useId } from 'react'
import type { RecipeLine } from '../types'

interface Props {
  layers?: RecipeLine[]
  height?: number
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// Color y posición de cada capa según el ingrediente (abajo → arriba)
function style(name: string): { color: string; rank: number } {
  const n = norm(name)
  if (n.includes('espuma')) return { color: '#fffaf0', rank: 4 }
  if (n.includes('leche')) return { color: '#e4c7a0', rank: 3 }
  if (n.includes('agua')) return { color: '#8fb9e3', rank: 2 }
  if (n.includes('chocolate')) return { color: '#4a2713', rank: 1 }
  if (n.includes('cafe')) return { color: '#6b3a1e', rank: 0 }
  return { color: '#a98467', rank: 2.5 }
}

// Cuerpo de la taza (esquinas inferiores redondeadas)
const BODY = 'M18 36 H98 V84 Q98 112 70 112 H46 Q18 112 18 84 Z'
const BOTTOM = 112
const FILL_HEIGHT = 68 // el líquido llega a y = 44, justo bajo el borde

/** Taza dibujada con las capas reales de la receta: la altura de cada capa es proporcional a su cantidad. */
export default function CupSvg({ layers = [], height = 200 }: Props) {
  const clipId = useId()
  const sorted = [...layers]
    .map((l) => ({ ...l, ...style(l.ingredientName) }))
    .sort((a, b) => a.rank - b.rank)
  const total = sorted.reduce((sum, l) => sum + l.quantity, 0)

  let y = BOTTOM
  const rects = sorted.map((l) => {
    const h = total > 0 ? (l.quantity / total) * FILL_HEIGHT : 0
    y -= h
    return { key: l.ingredientId, color: l.color, y, h }
  })
  const topLayer = sorted[sorted.length - 1]
  const topY = y

  return (
    <svg viewBox="0 0 150 130" height={height} role="img" aria-label="Taza con las capas de la receta">
      <defs>
        <clipPath id={clipId}>
          <path d={BODY} />
        </clipPath>
      </defs>

      {/* platillo */}
      <ellipse cx="58" cy="116" rx="54" ry="7" fill="#fff3d6" stroke="#2b2e48" strokeWidth="4" />

      {/* asa */}
      <path d="M98 50 H114 Q134 50 134 70 Q134 90 114 90 H96" fill="none" stroke="#2b2e48" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />

      {/* capas */}
      <g clipPath={`url(#${clipId})`}>
        {rects.map((r) => (
          <rect key={r.key} x="0" y={r.y} width="150" height={r.h + 0.5} fill={r.color} />
        ))}
      </g>

      {/* espuma que sobresale del borde */}
      {topLayer && style(topLayer.ingredientName).rank === 4 && (
        <ellipse cx="58" cy={Math.max(topY, 38)} rx="38" ry="9" fill="#fffaf0" stroke="#2b2e48" strokeWidth="3.5" />
      )}

      {/* contorno y brillo */}
      <path d={BODY} fill="rgba(255,255,255,0.1)" stroke="#2b2e48" strokeWidth="4" strokeLinejoin="round" />
      <path d="M27 50 V84" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}
