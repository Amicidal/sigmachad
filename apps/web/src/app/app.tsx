import { useState, useEffect } from 'react';
import styles from './app.module.css';

export function App() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check backend health
    fetch('http://localhost:3001/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Backend not available');
        setLoading(false);
      });
  }, []);

  return (
    <div className={styles['container']}>
      <header className={styles['header']}>
        <h1>Memento - Codebase Knowledge Graph</h1>
        <p>AI-powered codebase analysis and insights</p>
      </header>

      <main className={styles['main']}>
        <section className={styles['status']}>
          <h2>System Status</h2>
          {loading && <p>Checking system status...</p>}
          {error && <p className={styles['error']}>{error}</p>}
          {health && (
            <div className={styles['health']}>
              <p className={styles[health.status]}>
                Status: {health.status}
              </p>
              {health.services && (
                <div className={styles['services']}>
                  <h3>Services:</h3>
                  <ul>
                    {Object.entries(health.services).map(([service, status]) => (
                      <li key={service}>
                        {service}: <span className={styles[status as string]}>{status as string}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <section className={styles['features']}>
          <h2>Features</h2>
          <div className={styles['feature-grid']}>
            <div className={styles['feature']}>
              <h3>📊 Code Analysis</h3>
              <p>Analyze your codebase structure, dependencies, and relationships</p>
            </div>
            <div className={styles['feature']}>
              <h3>🔍 Semantic Search</h3>
              <p>Find code entities, patterns, and implementations across your project</p>
            </div>
            <div className={styles['feature']}>
              <h3>📚 Documentation</h3>
              <p>Extract and analyze documentation from your codebase</p>
            </div>
            <div className={styles['feature']}>
              <h3>🔒 Security Scanning</h3>
              <p>Identify vulnerabilities, security issues, and potential risks</p>
            </div>
            <div className={styles['feature']}>
              <h3>🧩 Knowledge Graph</h3>
              <p>Visualize and explore relationships between code entities</p>
            </div>
            <div className={styles['feature']}>
              <h3>🤖 MCP Integration</h3>
              <p>Connect AI agents to your codebase via Model Context Protocol</p>
            </div>
          </div>
        </section>

        <section className={styles['actions']}>
          <h2>Quick Actions</h2>
          <div className={styles['action-buttons']}>
            <button className={styles['action-btn']}>
              Sync Codebase
            </button>
            <button className={styles['action-btn']}>
              View Graph
            </button>
            <button className={styles['action-btn']}>
              Run Analysis
            </button>
            <button className={styles['action-btn']}>
              Generate Report
            </button>
          </div>
        </section>
      </main>

      <footer className={styles['footer']}>
        <p>&copy; 2024 Memento - AI Coding Assistant with Knowledge Graph</p>
      </footer>
    </div>
  );
}

export default App;