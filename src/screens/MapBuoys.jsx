import { useEffect, useState } from 'react'
import { getSpots, getBuoys, getConditions } from '../api'

// ── Map projection ──────────────────────────────────────────────
const MAP_W = 400
const MAP_H = 280
const LAT_MIN = 32.3, LAT_MAX = 34.6
const LNG_MIN = -120.8, LNG_MAX = -116.9

function project(lat, lng) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H
  return { x: Math.round(x), y: Math.round(y) }
}

function pts(coords) {
  return coords.map(([lat, lng]) => {
    const p = project(lat, lng)
    return `${p.x},${p.y}`
  }).join(' ')
}

// SoCal coastline points [lat, lng] — traced from north to south
const COASTLINE = [
  [34.6,-120.2],[34.45,-120.0],[34.40,-119.88],[34.28,-119.30],[34.22,-119.20],
  [34.14,-119.08],[34.11,-119.05],// Point Mugu
  [34.06,-118.92],[34.00,-118.81],// Point Dume
  [34.02,-118.72],[34.01,-118.57],[34.01,-118.50],// Santa Monica
  [33.96,-118.45],[33.88,-118.40],// Manhattan Beach
  [33.82,-118.39],[33.78,-118.40],
  [33.74,-118.41],[33.73,-118.38],// Palos Verdes tip
  [33.71,-118.29],// San Pedro
  [33.74,-118.22],[33.76,-118.19],// Long Beach
  [33.74,-118.10],[33.71,-118.05],// Seal Beach
  [33.66,-118.00],// Huntington Beach
  [33.61,-117.95],[33.60,-117.93],// Newport Beach
  [33.56,-117.83],[33.54,-117.78],// Laguna Beach
  [33.50,-117.72],[33.47,-117.70],// Dana Point
  [33.43,-117.62],[33.38,-117.57],// San Clemente
  [33.30,-117.48],[33.19,-117.38],// Oceanside
  [33.10,-117.32],[33.04,-117.29],// Encinitas
  [32.96,-117.27],[32.85,-117.27],// La Jolla
  [32.72,-117.23],[32.67,-117.24],// Point Loma
  [32.58,-117.13],
]

// Catalina Island — more detailed trace
const CATALINA = [
  [33.48,-118.32],[33.47,-118.35],[33.46,-118.40],[33.44,-118.46],
  [33.42,-118.52],[33.39,-118.57],[33.36,-118.60],[33.34,-118.59],
  [33.33,-118.55],[33.34,-118.49],[33.36,-118.43],[33.39,-118.37],
  [33.43,-118.32],[33.46,-118.30],[33.48,-118.32],
]

// Hardcoded buoy positions (NOAA)
const BUOY_COORDS = {
  '46025': { lat: 33.755, lng: -119.045 },
  '46086': { lat: 32.504, lng: -118.029 },
  '46222': { lat: 33.618, lng: -118.317 },
  '46219': { lat: 33.220, lng: -119.882 },
}

const ratingColor = {
  excellent: '#00e5c8',
  good:      '#5ab8f0',
  fair:      '#f4a84e',
  poor:      '#ff6b5b',
}

export default function MapBuoys() {
  const [spots, setSpots]           = useState([])
  const [buoys, setBuoys]           = useState([])
  const [spotConditions, setSpotConditions] = useState({})
  const [tooltip, setTooltip]       = useState(null)
  const [selectedBuoy, setSelectedBuoy] = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([getSpots(), getBuoys()]).then(([sRes, bRes]) => {
      setSpots(sRes.spots)
      setBuoys(bRes.buoys)
      setLoading(false)
      // Fetch conditions for each spot to color-code map markers
      sRes.spots.forEach(s => {
        getConditions(s.slug).then(({ conditions }) => {
          setSpotConditions(prev => ({ ...prev, [s.slug]: conditions }))
        }).catch(() => {})
      })
    }).catch(() => setLoading(false))
  }, [])

  function handleSpotClick(e, spot) {
    e.stopPropagation()
    const c = spotConditions[spot.slug]
    setTooltip({ type: 'spot', spot, conditions: c })
    setSelectedBuoy(spot.nearestBuoy)
  }

  function handleBuoyClick(e, buoy) {
    e.stopPropagation()
    setTooltip({ type: 'buoy', buoy })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold tracking-tight">
          Dive<span style={{ color: 'var(--biolum)' }}>Line</span>
          <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-m)' }}>Map & Buoys</span>
        </h1>
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden mb-2"
        style={{ background: '#040c18', border: '1px solid var(--glass-b)' }}
        onClick={() => { setTooltip(null); setSelectedBuoy(null) }}>
        <svg width="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ display: 'block' }}>
          {/* Ocean */}
          <rect width={MAP_W} height={MAP_H} fill="#040c18" />

          {/* Subtle grid */}
          {[1,2,3].map(i => (
            <line key={`h${i}`} x1={0} y1={MAP_H*i/4} x2={MAP_W} y2={MAP_H*i/4} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          ))}
          {[1,2,3,4,5].map(i => (
            <line key={`v${i}`} x1={MAP_W*i/6} y1={0} x2={MAP_W*i/6} y2={MAP_H} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          ))}

          {/* Land mass */}
          {(() => {
            const coastPts = COASTLINE.map(([lat,lng]) => project(lat,lng))
            const d = coastPts.map((p,i) => {
              if (i === 0) return `M${p.x},${p.y}`
              const prev = coastPts[i-1]
              const cx1 = prev.x + (p.x - prev.x) * 0.5
              const cy1 = prev.y
              const cx2 = prev.x + (p.x - prev.x) * 0.5
              const cy2 = p.y
              return `C${cx1},${cy1} ${cx2},${cy2} ${p.x},${p.y}`
            }).join(' ')
            return (
              <g>
                {/* Land fill — closes to corners, no stroke */}
                <path d={`${d} L${MAP_W},${MAP_H} L${MAP_W},0 Z`}
                  fill="rgba(13,32,53,0.9)" stroke="none" />
                {/* Coastline stroke only — follows the shore */}
                <path d={d} fill="none" stroke="rgba(0,229,200,0.3)" strokeWidth="1.2" />
              </g>
            )
          })()}

          {/* Catalina Island */}
          {(() => {
            const catPts = CATALINA.map(([lat,lng]) => project(lat,lng))
            const d = catPts.map((p,i) => {
              if (i === 0) return `M${p.x},${p.y}`
              const prev = catPts[i-1]
              const cx1 = prev.x + (p.x - prev.x) * 0.5
              const cy1 = prev.y
              const cx2 = prev.x + (p.x - prev.x) * 0.5
              const cy2 = p.y
              return `C${cx1},${cy1} ${cx2},${cy2} ${p.x},${p.y}`
            }).join(' ')
            return (
              <path d={`${d} Z`} fill="rgba(13,32,53,0.9)" stroke="rgba(0,229,200,0.25)" strokeWidth="1" />
            )
          })()}

          {/* Connecting lines: spot → nearest buoy */}
          {spots.map(s => {
            const buoyCoord = BUOY_COORDS[s.nearestBuoy]
            if (!buoyCoord) return null
            const sp = project(s.lat, s.lng)
            const bp = project(buoyCoord.lat, buoyCoord.lng)
            return (
              <line key={`line-${s.slug}`}
                x1={sp.x} y1={sp.y} x2={bp.x} y2={bp.y}
                stroke="rgba(0,229,200,0.1)" strokeWidth="1" strokeDasharray="3,4" />
            )
          })}

          {/* Buoy markers */}
          {buoys.map(b => {
            const coord = BUOY_COORDS[b.id]
            if (!coord) return null
            const { x, y } = project(coord.lat, coord.lng)
            const isSelected = selectedBuoy === b.id
            return (
              <g key={b.id} onClick={e => handleBuoyClick(e, b)} style={{ cursor: 'pointer' }}>
                {isSelected && <circle cx={x} cy={y} r={14} fill="rgba(176,145,255,0.15)" />}
                <circle cx={x} cy={y} r={7} fill="rgba(176,145,255,0.2)" stroke="#b091ff" strokeWidth={isSelected ? 2 : 1.5} />
                <circle cx={x} cy={y} r={2.5} fill="#b091ff" />
              </g>
            )
          })}

          {/* Dive spot markers — color-coded by live conditions */}
          {spots.map(s => {
            const { x, y } = project(s.lat, s.lng)
            const c     = spotConditions[s.slug]
            const color = c ? ratingColor[c.visibility.rating] : '#3d6275'
            return (
              <g key={s.slug} onClick={e => handleSpotClick(e, s)} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r={11} fill={`${color}22`} stroke={color} strokeWidth="1.5" />
                <text x={x} y={y+4} textAnchor="middle" fontSize="9" fill={color} fontFamily="DM Mono">★</text>
              </g>
            )
          })}

          {/* Tooltip */}
          {tooltip && (() => {
            if (tooltip.type === 'spot') {
              const { spot, conditions: c } = tooltip
              const { x, y } = project(spot.lat, spot.lng)
              const tx = Math.min(Math.max(x, 75), MAP_W - 75)
              const ty = y > MAP_H * 0.6 ? y - 78 : y + 18
              const color = c ? ratingColor[c.visibility.rating] : '#3d6275'
              return (
                <g>
                  <rect x={tx-72} y={ty} width={144} height={c ? 72 : 28} rx={8}
                    fill="#091524" stroke={color} strokeWidth="1" opacity="0.97"/>
                  <text x={tx} y={ty+14} textAnchor="middle" fontSize="9.5" fill="#e8f4f0" fontFamily="Syne" fontWeight="700">{spot.name}</text>
                  {c && <>
                    <text x={tx} y={ty+28} textAnchor="middle" fontSize="8" fill={color} fontFamily="DM Mono">{c.visibility.feet} ft vis · {c.visibility.rating}</text>
                    <text x={tx} y={ty+41} textAnchor="middle" fontSize="8" fill="#7ba8b8" fontFamily="DM Mono">{c.waterTempF}°F · {c.currentKn} kn {c.currentDirection}</text>
                    <text x={tx} y={ty+54} textAnchor="middle" fontSize="7.5" fill="#3d6275" fontFamily="DM Mono">src: {c.visibility.source}</text>
                    <text x={tx} y={ty+65} textAnchor="middle" fontSize="7" fill="#3d6275" fontFamily="DM Mono">tap away to close</text>
                  </>}
                </g>
              )
            }
            if (tooltip.type === 'buoy') {
              const { buoy: b } = tooltip
              const coord = BUOY_COORDS[b.id]
              if (!coord) return null
              const { x, y } = project(coord.lat, coord.lng)
              const tx = Math.min(Math.max(x, 70), MAP_W - 70)
              const ty = y > MAP_H * 0.6 ? y - 60 : y + 18
              return (
                <g>
                  <rect x={tx-68} y={ty} width={136} height={52} rx={8}
                    fill="#091524" stroke="#b091ff" strokeWidth="1" opacity="0.97"/>
                  <text x={tx} y={ty+14} textAnchor="middle" fontSize="9" fill="#e8f4f0" fontFamily="Syne" fontWeight="700">{b.stationName ?? `Buoy ${b.id}`}</text>
                  <text x={tx} y={ty+27} textAnchor="middle" fontSize="8" fill="#b091ff" fontFamily="DM Mono">NDBC {b.id}</text>
                  <text x={tx} y={ty+40} textAnchor="middle" fontSize="8" fill="#7ba8b8" fontFamily="DM Mono">
                    {b.waterTempF ? `${b.waterTempF}°F` : '—'} · {b.waveHeightFt ? `${b.waveHeightFt}ft` : '—'} · {b.windSpeedKn ? `${b.windSpeedKn}kn` : '—'}
                  </text>
                </g>
              )
            }
          })()}
        </svg>

        {/* Legend */}
        <div className="flex gap-5 px-4 py-2.5" style={{ borderTop: '1px solid var(--glass-b)' }}>
          <LegendDot color="var(--biolum)" label="Dive sites" />
          <LegendDot color="var(--purple)" label="NOAA buoys" />
          <div className="flex gap-2 ml-auto items-center">
            {['excellent','good','fair','poor'].map(r => (
              <div key={r} className="w-2 h-2 rounded-full" style={{ background: ratingColor[r] }} title={r} />
            ))}
            <span className="mono text-xs ml-1" style={{ color: 'var(--text-m)' }}>conditions</span>
          </div>
        </div>
      </div>

      {/* Tap hint */}
      <p className="mono text-xs text-center mb-5" style={{ color: 'var(--text-m)' }}>
        Tap a marker for live data
      </p>

      {/* Buoy cards */}
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-m)' }}>Buoy Stations</p>
      {loading && <p className="mono text-sm" style={{ color: 'var(--text-m)' }}>Loading...</p>}
      <div className="flex flex-col gap-3 mb-6">
        {buoys.map(b => {
          const isSelected = selectedBuoy === b.id
          return (
            <div key={b.id} className="rounded-xl p-4 transition-all"
              style={{
                background: 'var(--deep)',
                border: `1px solid ${isSelected ? '#b091ff' : 'var(--glass-b)'}`,
                boxShadow: isSelected ? '0 0 12px rgba(176,145,255,0.15)' : 'none',
              }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-sm">{b.stationName ?? `Buoy ${b.id}`}</p>
                  <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-m)' }}>NDBC {b.id}</p>
                </div>
                <div className="text-right">
                  {b.waveHeightFt != null && (
                    <p className="mono text-lg font-semibold leading-none" style={{ color: 'var(--blue)' }}>{b.waveHeightFt}<span className="text-xs ml-0.5">ft</span></p>
                  )}
                  {b.dominantPeriodS && (
                    <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-m)' }}>{b.dominantPeriodS}s period</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <BuoyStat label="Temp"      value={b.waterTempF    ? `${b.waterTempF}°F`              : '—'} color="var(--blue)"   />
                <BuoyStat label="Wind"      value={b.windSpeedKn   ? `${b.windSpeedKn} kn`             : '—'} color="var(--text-s)" />
                <BuoyStat label="Direction" value={b.windDirection ?? '—'}                                     color="var(--text-s)" />
                <BuoyStat label="Current"   value={b.currentKn     ? `${b.currentKn} kn`               : '—'} color="var(--biolum)" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-s)' }}>
      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      {label}
    </div>
  )
}

function BuoyStat({ label, value, color }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-m)' }}>{label}</p>
      <p className="mono text-xs font-medium" style={{ color }}>{value}</p>
    </div>
  )
}
