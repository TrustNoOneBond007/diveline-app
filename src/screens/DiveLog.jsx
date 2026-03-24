import { useEffect, useState } from 'react'
import { getSpots, getConditions, getLogs, saveLog, deleteLog } from '../api'

const EMPTY = { site: '', date: '', depthFt: '', durationMin: '', visibilityFt: '', waterTempF: '', surge: '', buddy: '', rating: '', notes: '' }

export default function DiveLog() {
  const [spots, setSpots]   = useState([])
  const [logs, setLogs]     = useState([])
  const [form, setForm]     = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [open, setOpen]     = useState(false)

  useEffect(() => {
    getSpots().then(({ spots }) => setSpots(spots))
    refreshLogs()
  }, [])

  function refreshLogs() {
    getLogs().then(({ entries }) => setLogs(entries ?? [])).catch(() => {})
  }

  async function autoFill() {
    if (!form.site) return
    const spot = spots.find(s => s.name === form.site)
    if (!spot) return
    try {
      const { conditions: c } = await getConditions(spot.slug)
      setForm(f => ({
        ...f,
        visibilityFt: c.visibility.feet,
        waterTempF:   c.waterTempF,
        surge:        c.surgeLevel,
        date:         f.date || new Date().toISOString().split('T')[0],
      }))
    } catch (_) {}
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.site || !form.date) return
    setSaving(true)
    await saveLog({ ...form, depthFt: +form.depthFt || null, durationMin: +form.durationMin || null, visibilityFt: +form.visibilityFt || null, waterTempF: +form.waterTempF || null, rating: +form.rating || null })
    setForm(EMPTY)
    setOpen(false)
    refreshLogs()
    setSaving(false)
  }

  async function handleDelete(id) {
    await deleteLog(id)
    refreshLogs()
  }

  const total   = logs.length
  const avgVis  = logs.filter(l => l.visibilityFt).length
    ? Math.round(logs.filter(l => l.visibilityFt).reduce((a, b) => a + b.visibilityFt, 0) / logs.filter(l => l.visibilityFt).length)
    : null
  const favSite = logs.length
    ? Object.entries(logs.reduce((acc, l) => ({ ...acc, [l.site]: (acc[l.site] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1])[0]?.[0]
    : null

  return (
    <div className="max-w-6xl mx-auto px-4 pt-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold tracking-tight">
          Dive<span style={{ color: 'var(--biolum)' }}>Line</span>
          <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-m)' }}>Dive Log</span>
        </h1>
        <button onClick={() => setOpen(o => !o)}
          className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
          style={{ background: 'var(--biolum-dim)', color: 'var(--biolum)', border: '1px solid var(--biolum)' }}>
          + Log Dive
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatBox label="Total Dives"   value={total} />
        <StatBox label="Avg Visibility" value={avgVis ? `${avgVis} ft` : '—'} />
        <StatBox label="Fav Site"       value={favSite ?? '—'} small />
      </div>

      {/* Log form */}
      {open && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 mb-5" style={{ background: 'var(--mid)', border: '1px solid var(--glass-b)' }}>
          <p className="font-semibold mb-4">New Dive Entry</p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="col-span-2">
              <Label>Site</Label>
              <select value={form.site} onChange={e => setForm(f => ({ ...f, site: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-sm" required
                style={{ background: 'var(--deep)', color: 'var(--text-p)', border: '1px solid var(--glass-b)' }}>
                <option value="">Select a spot</option>
                {spots.map(s => <option key={s.slug} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} required />
            </div>

            <div className="flex items-end">
              <button type="button" onClick={autoFill}
                className="w-full py-2 rounded-lg text-xs font-semibold"
                style={{ background: 'var(--biolum-dim)', color: 'var(--biolum)', border: '1px solid var(--biolum)' }}>
                Auto-fill today's conditions
              </button>
            </div>

            <div><Label>Depth (ft)</Label><Input type="number" value={form.depthFt} onChange={v => setForm(f => ({ ...f, depthFt: v }))} placeholder="60" /></div>
            <div><Label>Duration (min)</Label><Input type="number" value={form.durationMin} onChange={v => setForm(f => ({ ...f, durationMin: v }))} placeholder="45" /></div>
            <div><Label>Visibility (ft)</Label><Input type="number" value={form.visibilityFt} onChange={v => setForm(f => ({ ...f, visibilityFt: v }))} placeholder="30" /></div>
            <div><Label>Water Temp (°F)</Label><Input type="number" value={form.waterTempF} onChange={v => setForm(f => ({ ...f, waterTempF: v }))} placeholder="62" /></div>
            <div><Label>Surge</Label>
              <select value={form.surge} onChange={e => setForm(f => ({ ...f, surge: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--deep)', color: 'var(--text-p)', border: '1px solid var(--glass-b)' }}>
                <option value="">—</option>
                <option>none</option><option>low</option><option>moderate</option><option>high</option>
              </select>
            </div>
            <div><Label>Buddy</Label><Input type="text" value={form.buddy} onChange={v => setForm(f => ({ ...f, buddy: v }))} placeholder="Name" /></div>
            <div><Label>Rating (1–5)</Label>
              <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={{ background: 'var(--deep)', color: 'var(--text-p)', border: '1px solid var(--glass-b)' }}>
                <option value="">—</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <Label>Notes</Label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3} placeholder="Saw a garibaldi near the anchor..."
                className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                style={{ background: 'var(--deep)', color: 'var(--text-p)', border: '1px solid var(--glass-b)' }} />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--glass)', color: 'var(--text-s)', border: '1px solid var(--glass-b)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--biolum)', color: '#060d16' }}>
              {saving ? 'Saving...' : 'Save Dive'}
            </button>
          </div>
        </form>
      )}

      {/* Log history */}
      {logs.length === 0 && !open && (
        <p className="mono text-sm text-center py-10" style={{ color: 'var(--text-m)' }}>No dives logged yet.</p>
      )}
      <div className="flex flex-col gap-3 mb-6">
        {logs.map(entry => (
          <div key={entry.id} className="rounded-xl p-4" style={{ background: 'var(--deep)', border: '1px solid var(--glass-b)' }}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-sm">{entry.site}</p>
                <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-m)' }}>{entry.date}</p>
              </div>
              <div className="flex items-center gap-3">
                {entry.rating && <span style={{ color: 'var(--warm)' }}>{'★'.repeat(entry.rating)}</span>}
                <button onClick={() => handleDelete(entry.id)} className="text-xs" style={{ color: 'var(--text-m)' }}>✕</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {entry.depthFt     && <MiniStat label="Depth"  value={`${entry.depthFt} ft`} />}
              {entry.durationMin && <MiniStat label="Time"   value={`${entry.durationMin} min`} />}
              {entry.visibilityFt && <MiniStat label="Vis"   value={`${entry.visibilityFt} ft`} />}
              {entry.waterTempF  && <MiniStat label="Temp"   value={`${entry.waterTempF}°F`} />}
              {entry.surge       && <MiniStat label="Surge"  value={entry.surge} />}
              {entry.buddy       && <MiniStat label="Buddy"  value={entry.buddy} />}
            </div>
            {entry.notes && <p className="text-xs mt-2" style={{ color: 'var(--text-s)' }}>{entry.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function StatBox({ label, value, small }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: 'var(--deep)', border: '1px solid var(--glass-b)' }}>
      <p className={`mono font-semibold mb-0.5 ${small ? 'text-xs' : 'text-lg'}`} style={{ color: 'var(--biolum)' }}>{value}</p>
      <p className="text-xs" style={{ color: 'var(--text-m)' }}>{label}</p>
    </div>
  )
}

function Label({ children }) {
  return <p className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-m)' }}>{children}</p>
}

function Input({ type, value, onChange, placeholder, required }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
      className="w-full rounded-lg px-3 py-2 text-sm"
      style={{ background: 'var(--deep)', color: 'var(--text-p)', border: '1px solid var(--glass-b)' }} />
  )
}

function MiniStat({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-m)' }}>{label}</p>
      <p className="mono text-xs font-medium capitalize" style={{ color: 'var(--text-s)' }}>{value}</p>
    </div>
  )
}
