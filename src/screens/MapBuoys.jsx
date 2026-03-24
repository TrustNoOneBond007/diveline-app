import { useEffect, useState } from 'react'
import { getSpots, getBuoys } from '../api'

// SoCal bounding box for map projection
const MAP_W = 360
const MAP_H = 240
const LAT_MIN = 32.3, LAT_MAX = 34.6
const LNG_MIN = -120.6, LNG_MAX = -117.1

function project(lat, lng) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * MAP_W
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * MAP_H
  return { x, y }
}

const ratingColor = {
  excellent: 'var(--biolum)',
  good:      'var(--blue)',
  fair:      'var(--warm)',
  poor:      'var(--alert)',
}

export default function MapBuoys() {
  const [spots, setSpots]   = useState([])
  const [buoys, setBuoys]   = useState([])
  const [tooltip, setTooltip] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSpots(), getBuoys()]).then(([sRes, bRes]) => {
      setSpots(sRes.spots)
      setBuoys(bRes.buoys)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-lg mx-auto px-4 pt-5">
      <h1 className="text-xl font-bold tracking-tight mb-4">
        Dive<span style={{ color: 'var(--biolum)' }}>Line</span>
        <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-m)' }}>Map & Buoys</span>
      </h1>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden mb-5 relative"
        style={{ background: 'var(--mid)', border: '1px solid var(--glass-b)' }}
        onClick={() => setTooltip(null)}>
        <svg width="100%" viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ display: 'block' }}>
          {/* Ocean background */}
          <rect width={MAP_W} height={MAP_H} fill="#060d16" />

          {/* Simple SoCal coastline approximation */}
          <polyline
            points="320,10 290,30 260,50 230,60 200,75 170,90 140,100 110,115 80,130 50,155 20,180 10,220"
            fill="none" stroke="rgba(0,229,200,0.15)" strokeWidth="1.5" />

          {/* Grid lines */}
          {[1,2,3].map(i => (
            <line key={i} x1={0} y1={MAP_H * i / 4} x2={MAP_W} y2={MAP_H * i / 4}
              stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          ))}

          {/* Buoy markers */}
          {buoys.map(b => {
            const lat = b.lat ?? (b.id === '46025' ? 33.755 : b.id === '46086' ? 32.504 : b.id === '46222' ? 33.618 : 33.220)
            const lng = b.lng ?? (b.id === '46025' ? -119.045 : b.id === '46086' ? -118.029 : b.id === '46222' ? -118.317 : -119.882)
            const { x, y } = project(lat, lng)
            return (
              <g key={b.id} onClick={e => { e.stopPropagation(); setTooltip({ type: 'buoy', data: b, x, y }) }}
                style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r={8} fill="rgba(176,145,255,0.15)" stroke="var(--purple)" strokeWidth="1.5" />
                <circle cx={x} cy={y} r={3} fill="var(--purple)" />
              </g>
            )
          })}

          {/* Dive spot markers */}
          {spots.map(s => {
            const { x, y } = project(s.lat, s.lng)
            return (
              <g key={s.slug} onClick={e => { e.stopPropagation(); setTooltip({ type: 'spot', data: s, x, y }) }}
                style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r={10} fill="var(--biolum-dim)" stroke="var(--biolum)" strokeWidth="1.5" />
                <text x={x} y={y + 4} textAnchor="middle" fontSize="9" fill="var(--biolum)" fontFamily="DM Mono">★</text>
              </g>
            )
          })}

          {/* Tooltip */}
          {tooltip && (() => {
            const tx = Math.min(Math.max(tooltip.x, 60), MAP_W - 60)
            const ty = tooltip.y > MAP_H / 2 ? tooltip.y - 55 : tooltip.y + 20
            const d = tooltip.data
            const label = tooltip.type === 'spot' ? d.name : `Buoy ${d.id}`
            const sub   = tooltip.type === 'buoy' && d.waterTempF ? `${d.waterTempF}°F · ${d.waveHeightFt ?? '—'} ft waves` : ''
            return (
              <g>
                <rect x={tx - 58} y={ty} width={116} height={sub ? 36 : 24} rx={6}
                  fill="#091524" stroke="rgba(0,229,200,0.3)" strokeWidth="1" />
                <text x={tx} y={ty + 14} textAnchor="middle" fontSize="9" fill="var(--text-p)" fontFamily="Syne" fontWeight="600">
                  {label}
                </text>
                {sub && (
                  <text x={tx} y={ty + 27} textAnchor="middle" fontSize="8" fill="var(--text-s)" fontFamily="DM Mono">
                    {sub}
                  </text>
                )}
              </g>
            )
          })()}
        </svg>

        {/* Legend */}
        <div className="flex gap-4 px-4 py-2" style={{ borderTop: '1px solid var(--glass-b)' }}>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-s)' }}>
            <div className="w-3 h-3 rounded-full border" style={{ background: 'var(--biolum-dim)', borderColor: 'var(--biolum)' }} />
            Dive sites
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-s)' }}>
            <div className="w-3 h-3 rounded-full border" style={{ background: 'rgba(176,145,255,0.15)', borderColor: 'var(--purple)' }} />
            NOAA buoys
          </div>
        </div>
      </div>

      {/* Buoy cards */}
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-m)' }}>Buoy Stations</p>
      {loading && <p className="mono text-sm" style={{ color: 'var(--text-m)' }}>Loading...</p>}
      <div className="flex flex-col gap-3 mb-6">
        {buoys.map(b => (
          <div key={b.id} className="rounded-xl p-4" style={{ background: 'var(--deep)', border: '1px solid var(--glass-b)' }}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-sm">{b.stationName ?? `Buoy ${b.id}`}</p>
                <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-m)' }}>NDBC {b.id}</p>
              </div>
              {b.waveHeightFt && (
                <span className="mono text-sm font-medium" style={{ color: 'var(--blue)' }}>{b.waveHeightFt} ft</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <BuoyStat label="Temp"   value={b.waterTempF   ? `${b.waterTempF}°F`            : '—'} />
              <BuoyStat label="Wind"   value={b.windSpeedKn  ? `${b.windSpeedKn} kn`           : '—'} />
              <BuoyStat label="Period" value={b.dominantPeriodS ? `${b.dominantPeriodS}s`      : '—'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BuoyStat({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-m)' }}>{label}</p>
      <p className="mono text-sm" style={{ color: 'var(--text-s)' }}>{value}</p>
    </div>
  )
}
