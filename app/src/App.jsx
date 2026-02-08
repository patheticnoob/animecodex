import { useEffect, useMemo, useState } from 'react'
import './App.css'

const CATEGORIES = [
  ['most-popular', 'All Moods'],
  ['top-airing', 'Cozy Vibes'],
  ['movies', 'Adventure'],
  ['tv', 'Romance'],
  ['dubbed', 'Comedy'],
  ['special', 'Fantasy'],
]

const NAV_ITEMS = [
  ['home', 'Home'],
  ['browse', 'Browse'],
  ['search', 'Search'],
]

const FALLBACK_ANIME = [
  {
    id: 'fallback-1',
    name: 'Skyward Memories',
    poster: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=80',
    type: 'Featured',
  },
  {
    id: 'fallback-2',
    name: 'Rainy Days',
    poster: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80',
    type: 'Movie',
  },
  {
    id: 'fallback-3',
    name: 'Magical Colors',
    poster: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80',
    type: 'Series',
  },
]

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }

  return response.json()
}

function App() {
  const [tab, setTab] = useState('home')
  const [category, setCategory] = useState('most-popular')
  const [discover, setDiscover] = useState(FALLBACK_ANIME)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedAnime, setSelectedAnime] = useState(FALLBACK_ANIME[0])
  const [episodes, setEpisodes] = useState([])
  const [playerUrl, setPlayerUrl] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        const d = await api(`/api/discovery?category=${category}`)
        const animes = d.data?.data?.animes || d.data?.animes || []
        if (animes.length) {
          setDiscover(animes)
          if (!selectedAnime || selectedAnime.id?.startsWith('fallback')) {
            setSelectedAnime(animes[0])
          }
        }
        setStatusMessage('')
      } catch {
        setStatusMessage('Using fallback library while API is warming up.')
      }
    }

    run()
  }, [category])

  const continueSketches = useMemo(() => discover.slice(0, 3), [discover])
  const popular = useMemo(() => discover.slice(0, 5), [discover])

  const openAnime = async (anime) => {
    setSelectedAnime(anime)
    setTab('browse')
    setPlayerUrl('')
    try {
      const id = anime.dataId || anime.id
      const epData = await api(`/api/anime/${id}/episodes`)
      const items = epData.data?.episodes || epData.episodes || []
      setEpisodes(items)
    } catch {
      setEpisodes([])
      setStatusMessage('Episodes are unavailable for this title right now.')
    }
  }

  const playEpisode = async (anime, number) => {
    try {
      const id = anime.dataId || anime.id
      const data = await api(`/api/anime/${id}/episode/${number}`)
      const source = data.source?.data?.sources?.[0]?.url || data.source?.sources?.[0]?.url || ''
      setPlayerUrl(source)
      setTab('browse')
      if (!source) {
        setStatusMessage('No stream source returned for that episode.')
      } else {
        setStatusMessage('')
      }
    } catch {
      setStatusMessage('Could not load stream source. Try another episode.')
    }
  }

  const runSearch = async () => {
    if (!query.trim()) return
    try {
      const d = await api(`/api/search?q=${encodeURIComponent(query)}`)
      setSearchResults(d.data?.animes || d.data?.data?.animes || [])
      setStatusMessage('')
    } catch {
      setSearchResults([])
      setStatusMessage('Search is temporarily unavailable.')
    }
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">
          <div className="brand-dot">✦</div>
          <h1>AniCozy</h1>
        </div>

        <nav className="nav-tabs">
          {NAV_ITEMS.map(([key, label]) => (
            <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      {statusMessage && <p className="status-message">{statusMessage}</p>}

      <section className="hero-card">
        <img src={(selectedAnime?.poster || selectedAnime?.image || FALLBACK_ANIME[0].poster)} alt={selectedAnime?.name || 'Featured'} />
        <div className="hero-content">
          <p className="badge">Featured Series</p>
          <h2>{selectedAnime?.name || 'Skyward Memories'}</h2>
          <p>Join a relaxing anime journey and start streaming instantly — no account required.</p>
          <button onClick={() => openAnime(selectedAnime || FALLBACK_ANIME[0])}>Watch Episodes</button>
        </div>
      </section>

      <section className="section-block">
        <h3>Pick your mood</h3>
        <div className="chips">
          {CATEGORIES.map(([key, label]) => (
            <button key={key} className={category === key ? 'active' : ''} onClick={() => setCategory(key)}>
              {label}
            </button>
          ))}
        </div>
      </section>

      {(tab === 'home' || tab === 'browse') && (
        <>
          <section className="section-block">
            <h3>Continue Sketches</h3>
            <div className="grid">
              {continueSketches.map((anime) => (
                <AnimeCard key={anime.id || anime.dataId} anime={anime} onClick={() => openAnime(anime)} />
              ))}
            </div>
          </section>

          <section className="section-block">
            <h3>Now Streaming</h3>
            {episodes.length > 0 ? (
              <div className="episodes">
                {episodes.map((ep) => (
                  <button key={ep.number} onClick={() => playEpisode(selectedAnime, ep.number)}>
                    Episode {ep.number}
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">Pick a title to load episodes.</p>
            )}
            {playerUrl && <video src={playerUrl} controls autoPlay className="player" />}
          </section>

          <section className="section-block">
            <h3>Popular in Journal</h3>
            <div className="grid">
              {popular.map((anime) => (
                <AnimeCard key={`popular-${anime.id || anime.dataId}`} anime={anime} onClick={() => openAnime(anime)} />
              ))}
            </div>
          </section>
        </>
      )}

      {tab === 'search' && (
        <section className="section-block">
          <h3>Search anime</h3>
          <div className="search-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find your cozy anime..."
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
            <button onClick={runSearch}>Search</button>
          </div>

          <div className="grid">
            {searchResults.map((anime) => (
              <AnimeCard key={anime.id || anime.dataId} anime={anime} onClick={() => openAnime(anime)} />
            ))}
          </div>
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
      <p>{anime.type || 'Series'}</p>
    </article>
  )
}

export default App
