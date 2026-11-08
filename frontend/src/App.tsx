import { useEffect, useState } from 'react'
import api from './services/api'
import './App.css'

type BackendData = {
  timestamp?: string | null
  error?: string
  database_url_configured?: boolean
}

type ApiResponse = {
  success: boolean
  data: BackendData
}

function App() {
  const [backendData, setBackendData] = useState<BackendData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await api.get<ApiResponse>('/api/data')
      setBackendData(response.data.data)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to the backend.')
      setBackendData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  return (
    <main className="dashboard-shell">
      <section className="dashboard-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">TigerSIEM</p>
            <h1>Security telemetry dashboard</h1>
          </div>
          <button type="button" className="refresh-button" onClick={() => void fetchData()}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div className="status-row">
          <span className={`status-badge ${error ? 'offline' : 'online'}`}>
            {error ? 'Backend offline' : 'Backend online'}
          </span>
        </div>

        {error ? (
          <div className="message error">
            <strong>Connection issue:</strong> {error}
          </div>
        ) : null}

        <div className="metrics-grid">
          <article className="metric-card">
            <p className="label">Last database sync</p>
            <h2>{backendData?.timestamp ? new Date(backendData.timestamp).toLocaleString() : 'Waiting for data'}</h2>
          </article>

          <article className="metric-card">
            <p className="label">Connection</p>
            <h2>{backendData?.database_url_configured ? 'Configured' : 'Not configured'}</h2>
          </article>
        </div>

        <div className="raw-panel">
          <p className="label">Backend payload</p>
          <pre>{JSON.stringify(backendData ?? { message: 'No data yet' }, null, 2)}</pre>
        </div>
      </section>
    </main>
  )
}

export default App
