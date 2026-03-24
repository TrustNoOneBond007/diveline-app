const BASE = 'https://diveline-backend-production.up.railway.app'
const KEY  = 'diveline-local-secret-2024'

async function get(path) {
  const res = await fetch(`${BASE}${path}?key=${KEY}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export const getSpots      = ()     => get('/spots')
export const getConditions = (slug) => get(`/conditions/${slug}`)
export const getForecast   = (slug) => get(`/forecast/${slug}`)
export const getBuoys      = ()     => get('/buoys')
export const getLogs       = ()     => get('/log')
export const deleteLog     = (id)   => fetch(`${BASE}/log/${id}?key=${KEY}`, { method: 'DELETE' }).then(r => r.json())

export async function saveLog(entry) {
  const res = await fetch(`${BASE}/log?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  })
  return res.json()
}
