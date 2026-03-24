import { useEffect, useState } from 'react'
import { getSpots, getConditions, getForecast } from '../api'

const ratingColor = {
  excellent: 'var(--biolum)',
  good:      'var(--blue)',
  fair:      'var(--warm)',
  poor:      'var(--alert)',
}

const ratingPct   = { excellent: 100, good: 75, fair: 50, poor: 25 }
const ratingStars = { excellent: 5,   good: 4,  fair: 3,  poor: 1  }
const bestWindow  = { excellent: '07:00 — 10:00', good: '07:00 — 10:00', fair: '09:00 — 12:00', poor: 'Conditions poor' }

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// Convert decimal degrees to degrees + decimal minutes (e.g. 32°51'N)
function toDMS(lat, lng) {
  const fmt = (deg, dirs) => {
    const d = Math.floor(Math.abs(deg))
    const m = Math.round((Math.abs(deg) - d) * 60)
    return `${d}°${String(m).padStart(2,'0')}'${deg >= 0 ? dirs[0] : dirs[1]}`
  }
  return `${fmt(lat, ['N','S'])} ${fmt(lng, ['E','W'])}`
}

export default function Conditions() {
  const [spots, setSpots]           = useState([])
  const [slug, setSlug]             = useState(null)
  const [conditions, setConditions] = useState(null)
  const [forecast, setForecast]     = useState(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    getSpots().then(({ spots }) => {
      setSpots(spots)
      if (spots.length) selectSpot(spots[0].slug)
    })
  }, [])

  function selectSpot(newSlug) {
    setSlug(newSlug)
    setConditions(null)
    setForecast(null)
    setLoading(true)
    Promise.all([getConditions(newSlug), getForecast(newSlug)]).then(([c, f]) => {
      setConditions(c.conditions)
      setForecast(f.forecast)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const c        = conditions
  const spot     = spots.find(s => s.slug === slug)
  const alertVisible = c && c.waveHeightFt && c.waveHeightFt > 6

  const visDepth = c ? [
    { label: '0–20 ft',   feet: c.visibility.feet },
    { label: '20–60 ft',  feet: Math.round(c.visibility.feet * 0.75) },
    { label: '60–100 ft', feet: Math.round(c.visibility.feet * 0.5) },
  ] : []

  return (
    <div className="max-w-6xl mx-auto px-4 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold tracking-tight">
          Dive<span style={{ color: 'var(--biolum)' }}>Line</span>
        </h1>
        <span className="mono text-xs" style={{ color: 'var(--text-m)' }}>SoCal</span>
      </div>

      {/* Alert banner */}
      {alertVisible && (
        <div className="rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2 text-sm font-medium"
          style={{ background: 'rgba(255,107,91,0.15)', color: 'var(--alert)', border: '1px solid rgba(255,107,91,0.3)' }}>
          ⚠ High surf advisory — {c.waveHeightFt} ft waves at {spot?.name}
        </div>
      )}

      {/* Location pill bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 no-scrollbar">
        {spots.map(s => {
          const active = s.slug === slug
          return (
            <button key={s.slug} onClick={() => selectSpot(s.slug)}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all flex-shrink-0"
              style={{
                background: active ? 'var(--biolum-dim)' : 'var(--glass)',
                color:      active ? 'var(--biolum)'     : 'var(--text-s)',
                border:     `1px solid ${active ? 'var(--biolum)' : 'var(--glass-b)'}`,
              }}>
              {s.name}
            </button>
          )
        })}
      </div>

      {loading && (
        <div className="text-center py-16 mono text-sm" style={{ color: 'var(--text-m)' }}>
          Loading conditions...
        </div>
      )}

      {c && spot && (
        <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start">
          {/* LEFT column: hero card */}
          <div>
          {/* Hero card */}
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--mid)', border: '1px solid var(--glass-b)' }}>
            {/* Top row: name + rating badge */}
            <div className="flex justify-between items-start mb-1">
              <div>
                <h2 className="text-lg font-bold">{spot.name}</h2>
                <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-m)' }}>
                  {toDMS(spot.lat, spot.lng)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold uppercase tracking-wide text-lg leading-none"
                  style={{ color: ratingColor[c.visibility.rating] }}>
                  {c.visibility.rating}
                </p>
                <p className="text-xs uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-m)' }}>Conditions</p>
                <p className="mono text-xs mt-2" style={{ color: 'var(--text-m)' }}>Best window</p>
                <p className="mono text-xs font-medium" style={{ color: ratingColor[c.visibility.rating] }}>
                  {bestWindow[c.visibility.rating]}
                </p>
              </div>
            </div>

            {/* Star rating */}
            <div className="flex items-center gap-2 mb-4">
              <span style={{ color: 'var(--warm)', letterSpacing: '2px' }}>
                {'★'.repeat(ratingStars[c.visibility.rating])}{'☆'.repeat(5 - ratingStars[c.visibility.rating])}
              </span>
              <span className="mono text-xs" style={{ color: 'var(--text-m)' }}>
                {ratingStars[c.visibility.rating]}/5
              </span>
            </div>

            {/* VIZ bar */}
            <div className="flex items-center gap-3 mb-2">
              <span className="mono text-xs w-8" style={{ color: 'var(--text-m)' }}>VIZ</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--glass-b)' }}>
                <div className="h-full rounded-full"
                  style={{ width: `${ratingPct[c.visibility.rating]}%`, background: ratingColor[c.visibility.rating] }} />
              </div>
              <span className="mono text-xs w-12 text-right font-medium" style={{ color: 'var(--text-p)' }}>
                {c.visibility.feet} ft
              </span>
            </div>
            {/* MAX bar */}
            <div className="flex items-center gap-3 mb-4">
              <span className="mono text-xs w-8" style={{ color: 'var(--text-m)' }}>MAX</span>
              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--glass-b)' }}>
                <div className="h-full rounded-full w-full" style={{ background: 'var(--glass-b)', opacity: 0.6 }} />
              </div>
              <span className="mono text-xs w-12 text-right" style={{ color: 'var(--text-m)' }}>~60 ft</span>
            </div>

            <p className="mono text-xs" style={{ color: 'var(--text-m)' }}>
              Source: {c.visibility.source} · Updated {new Date(c.observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          </div>{/* end left column */}

          {/* RIGHT column: metrics, forecast, depth */}
          <div>
          {/* 4 metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4">
            <MetricCard
              icon={<TempIcon />}
              label="Water Temp"
              value={c.waterTempF ?? '—'}
              unit={c.waterTempF ? '°F' : ''}

              color="var(--blue)"
            />
            <MetricCard
              icon={<SurgeIcon />}
              label="Surge"
              value={c.waveHeightFt ?? '—'}
              unit={c.waveHeightFt ? 'ft' : ''}
              sub="Wave height proxy"
              color="var(--purple)"
            />
            <MetricCard
              icon={<SwellIcon />}
              label="Swell"
              value={c.waveHeightFt ?? '—'}
              unit={c.waveHeightFt ? 'ft' : ''}
              sub={c.dominantPeriodS ? `${c.dominantPeriodS}s · ${c.windDirection}` : ''}
              color="var(--blue)"
            />
            <MetricCard
              icon={<CurrentIcon />}
              label="Current"
              value={c.currentKn}
              unit="kn"
              sub={c.currentDirection}
              color="var(--warm)"
            />
          </div>

          {/* 7-day forecast strip */}
          {forecast && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-m)' }}>7-Day Forecast</p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {forecast.map((day, i) => {
                  const d     = new Date(day.date + 'T12:00:00')
                  const color = ratingColor[day.visibility.rating]
                  const today = i === 0
                  return (
                    <div key={day.date} className="flex flex-col items-center flex-shrink-0 rounded-xl overflow-hidden"
                      style={{
                        width: '72px',
                        background: 'var(--deep)',
                        border: `1px solid ${today ? 'var(--biolum)' : 'var(--glass-b)'}`,
                      }}>
                      <p className="mono text-xs font-medium pt-3 pb-2 uppercase tracking-widest"
                        style={{ color: today ? 'var(--biolum)' : 'var(--text-m)' }}>
                        {today ? 'Today' : DAY_NAMES[d.getDay()]}
                      </p>
                      <p className="mono text-2xl font-semibold leading-none" style={{ color }}>{day.visibility.feet}</p>
                      <p className="mono text-xs mb-3 mt-0.5" style={{ color: 'var(--text-m)' }}>ft</p>
                      <div className="w-full h-1" style={{ background: color }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Visibility by depth */}
          <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--deep)', border: '1px solid var(--glass-b)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-m)' }}>Visibility by Depth</p>
            <div className="flex flex-col gap-3">
              {visDepth.map(({ label, feet }) => {
                const pct    = Math.round((feet / 60) * 100)
                const rating = feet >= 40 ? 'excellent' : feet >= 25 ? 'good' : feet >= 15 ? 'fair' : 'poor'
                return (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs" style={{ color: 'var(--text-s)' }}>{label}</span>
                      <span className="mono text-xs font-medium" style={{ color: ratingColor[rating] }}>{feet} ft</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'var(--glass-b)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: ratingColor[rating] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          </div>{/* end right column */}
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon, label, value, unit, sub, color }) {
  return (
    <div className="rounded-xl p-4 flex flex-col justify-between"
      style={{ background: 'var(--deep)', border: '1px solid var(--glass-b)', borderBottom: `2px solid ${color}` }}>
      <div className="mb-3" style={{ color }}>{icon}</div>
      <div>
        <div className="flex items-end gap-1 mb-1">
          <span className="mono text-2xl font-semibold leading-none" style={{ color }}>{value}</span>
          <span className="mono text-sm mb-0.5" style={{ color }}>{unit}</span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-m)' }}>{label}</p>
        {sub && <p className="mono text-xs mt-1" style={{ color: 'var(--text-m)' }}>{sub}</p>}
      </div>
    </div>
  )
}

function TempIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  )
}

function SurgeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </svg>
  )
}

function SwellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12 Q6 6 12 12 Q18 18 22 12" />
    </svg>
  )
}

function CurrentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}
