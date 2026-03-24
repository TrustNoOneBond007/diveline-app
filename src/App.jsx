import { useState } from 'react'
import Conditions from './screens/Conditions'
import MapBuoys   from './screens/MapBuoys'
import DiveLog    from './screens/DiveLog'

const TABS = [
  { id: 'conditions', label: 'Conditions', icon: WaveIcon },
  { id: 'map',        label: 'Map',        icon: MapIcon  },
  { id: 'log',        label: 'Dive Log',   icon: LogIcon  },
]

export default function App() {
  const [tab, setTab] = useState('conditions')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--abyss)' }}>
      <div className="flex-1 overflow-auto pb-20">
        {tab === 'conditions' && <Conditions />}
        {tab === 'map'        && <MapBuoys />}
        {tab === 'log'        && <DiveLog />}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 border-t flex" style={{ background: 'var(--deep)', borderColor: 'var(--glass-b)' }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors"
              style={{ color: active ? 'var(--biolum)' : 'var(--text-m)' }}
            >
              <Icon active={active} />
              {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function WaveIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
    </svg>
  )
}

function MapIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  )
}

function LogIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
