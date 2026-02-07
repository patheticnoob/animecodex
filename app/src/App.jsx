import { useEffect, useMemo, useState } from 'react'
import './App.css'

const CATEGORIES = [
  ['most-popular', 'Most Popular'],
  ['top-airing', 'Top Airing'],
  ['tv', 'TV Shows'],
  ['movies', 'Movies'],
  ['subbed', 'Subbed'],
  ['dubbed', 'Dubbed'],
  ['ona', 'ONA'],
  ['ova', 'OVA'],
  ['special', 'Specials'],
]

const TABS = [
  ['home', 'Home'],
  ['search', 'Search'],
  ['watchlist', 'Watchlist'],
  ['continue', 'Continue'],
  ['history', 'History'],
]

const api = async (path, options = {}) => {
  const token = localStorage.getItem('token')
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  return response.json()
}

function App() {
  const [tab, setTab] = useState('home')
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [category, setCategory] = useState('most-popular')
  const [discover, setDiscover] = useState([])
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedAnime, setSelectedAnime] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [playerUrl, setPlayerUrl] = useState('')
  const [user, setUser] = useState(null)
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' })
  const [userData, setUserData] = useState({ watchlist: [], progress: {}, history: [] })

  useEffect(() => {
    document.body.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    api(`/api/discovery?category=${category}`).then((d) => setDiscover(d.data?.data?.animes || d.data?.animes || []))
  }, [category])

  useEffect(() => {
    api('/api/me').then((d) => {
      if (d.user) {
        setUser(d.user)
        refreshUserData()
      }
    })
  }, [])

  const recommendations = useMemo(() => {
    if (!userData.history.length) return discover.slice(0, 8)
    return [...discover].sort(() => Math.random() - 0.5).slice(0, 8)
  }, [discover, userData.history])

  const refreshUserData = () => api('/api/user-data').then((d) => d.watchlist && setUserData(d))

  const runAuth = async (action) => {
    const data = await api('/api/auth', { method: 'POST', body: JSON.stringify({ ...authForm, action }) })
    if (data.token) {
      localStorage.setItem('token', data.token)
      setUser(data.user)
      setTab('home')
      refreshUserData()
    }
  }

  const openAnime = async (anime) => {
    setSelectedAnime(anime)
    setTab('details')
    const id = anime.dataId || anime.id
    const epData = await api(`/api/anime/${id}/episodes`)
    setEpisodes(epData.data?.episodes || epData.episodes || [])
  }

  const playEpisode = async (anime, number) => {
    const id = anime.dataId || anime.id
    const data = await api(`/api/anime/${id}/episode/${number}`)
    const source = data.source?.data?.sources?.[0]?.url || data.source?.sources?.[0]?.url || ''
    setPlayerUrl(source)
    setTab('watch')
    if (user) {
      await api('/api/user-data', {
        method: 'PUT',
        body: JSON.stringify({ type: 'progress.save', payload: { animeId: id, animeTitle: anime.name, episodeNumber: number, timestamp: 0 } }),
      })
      refreshUserData()
    }
  }

  const addWatchlist = async () => {
    if (!user || !selectedAnime) return
    await api('/api/user-data', {
      method: 'PUT',
      body: JSON.stringify({ type: 'watchlist.add', payload: { id: selectedAnime.dataId || selectedAnime.id, name: selectedAnime.name, poster: selectedAnime.poster } }),
    })
    refreshUserData()
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">
          <p className="eyebrow">Anime Streaming Dashboard</p>
          <h1>AnimeCodex Stream</h1>
        </div>
        <nav className="nav-tabs">
          {TABS.map(([key, label]) => (
            <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>
          ))}
        </nav>
        <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</button>
      </header>

      <section className="card hero-card">
        <p className="status-pill">Demo mode</p>
        <h2>UI mockup for product direction</h2>
        <p>This build is a visual demo and does not include realtime data sync yet. Use it to validate layout and navigation flow before wiring live sources.</p>
      </section>

      {!user && (
        <section className="card auth-card">
          <h3>Login / Signup</h3>
          <div className="auth-grid">
            <input placeholder="Name" onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} />
            <input placeholder="Email" onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
            <input placeholder="Password" type="password" onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
          </div>
          <div className="row">
            <button onClick={() => runAuth('login')}>Login</button>
            <button onClick={() => runAuth('signup')}>Signup</button>
          </div>
        </section>
      )}

      {tab === 'home' && (
        <>
          <section className="card">
            <h2>Discovery</h2>
            <div className="row wrap chips">
              {CATEGORIES.map(([key, label]) => (
                <button key={key} className={category === key ? 'active' : ''} onClick={() => setCategory(key)}>{label}</button>
              ))}
            </div>
            <div className="grid">{discover.map((anime) => <AnimeCard key={anime.id || anime.dataId} anime={anime} onClick={() => openAnime(anime)} />)}</div>
          </section>
          <section className="card">
            <h2>Recommendations</h2>
            <div className="grid">{recommendations.map((anime) => <AnimeCard key={anime.id || anime.dataId} anime={anime} onClick={() => openAnime(anime)} />)}</div>
          </section>
        </>
      )}

      {tab === 'search' && (
        <section className="card">
          <h2>Search</h2>
          <div className="row">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search anime" />
            <button onClick={() => api(`/api/search?q=${encodeURIComponent(query)}`).then((d) => setSearchResults(d.data?.animes || d.data?.data?.animes || []))}>Find</button>
          </div>
          <div className="grid">{searchResults.map((anime) => <AnimeCard key={anime.id || anime.dataId} anime={anime} onClick={() => openAnime(anime)} />)}</div>
        </section>
      )}

      {tab === 'details' && selectedAnime && (
        <section className="card">
          <h2>{selectedAnime.name}</h2>
          <img src={selectedAnime.poster} alt={selectedAnime.name} className="poster" />
          <button onClick={addWatchlist}>Add to Watchlist</button>
          <h3>Episodes</h3>
          <div className="row wrap">
            {episodes.map((ep) => (
              <button key={ep.number} onClick={() => playEpisode(selectedAnime, ep.number)}>
                EP {ep.number} {userData.progress[`${selectedAnime.dataId || selectedAnime.id}::${ep.number}`] ? '✓' : ''}
              </button>
            ))}
          </div>
        </section>
      )}

      {tab === 'watch' && (
        <section className="card">
          <h2>Player</h2>
          {playerUrl ? <video src={playerUrl} controls autoPlay className="player" /> : <p>Pick an episode first.</p>}
        </section>
      )}

      {tab === 'watchlist' && (
        <section className="card">
          <h2>Watchlist</h2>
          {userData.watchlist.length ? (
            <div className="grid">{userData.watchlist.map((anime) => <AnimeCard key={anime.id} anime={anime} onClick={() => openAnime(anime)} />)}</div>
          ) : (
            <p className="empty">No items in watchlist yet.</p>
          )}
        </section>
      )}

      {tab === 'continue' && (
        <section className="card">
          <h2>Continue Watching</h2>
          {Object.values(userData.progress).length ? (
            <ul>{Object.values(userData.progress).map((item, i) => <li key={i}>{item.animeTitle} — Episode {item.episodeNumber}</li>)}</ul>
          ) : (
            <p className="empty">Start watching any episode to track progress.</p>
          )}
        </section>
      )}

      {tab === 'history' && (
        <section className="card">
          <h2>History</h2>
          {userData.history.length ? (
            <ul>{userData.history.map((item, i) => <li key={i}>{item.animeTitle} EP {item.episodeNumber} ({new Date(item.watchedAt).toLocaleString()})</li>)}</ul>
          ) : (
            <p className="empty">No watch history available yet.</p>
          )}
        </section>
      )}
    </div>
  )
}

function AnimeCard({ anime, onClick }) {
  return (
    <article className="anime" onClick={onClick}>
      <img src={anime.poster || anime.image} alt={anime.name || anime.title} />
      <h4>{anime.name || anime.title}</h4>
      <p>{anime.type} • {anime.episodes?.sub || anime.language || 'N/A'}</p>
    </article>
  )
}

export default App
