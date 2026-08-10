import { useState, useEffect } from 'react'

function SignedOutPage() {
  useEffect(() => {
    // Clear the Easy Auth session cookie in the background without navigating to Microsoft.
    // redirect:"manual" prevents the browser following the 302 to login.microsoftonline.com
    // while still letting the browser apply the Set-Cookie that expires the session.
    fetch('/.auth/logout', { redirect: 'manual', credentials: 'include' }).catch(() => {})
  }, [])

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Signed out.</h2>
      <a href="/.auth/login/aad?post_login_redirect_uri=/">Sign in with Microsoft</a>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [devLogin, setDevLogin] = useState(false)
  const [loading, setLoading] = useState(true)

  const isSignedOut = window.location.pathname === '/signed-out'

  useEffect(() => {
    if (isSignedOut) return
    Promise.all([
      fetch('/api/config/').then((r) => r.json()),
      fetch('/api/whoami/').then((r) => (r.ok ? r.json() : null)),
    ]).then(([config, whoami]) => {
      setDevLogin(config.dev_login)
      setUser(whoami)
      setLoading(false)
    })
  }, [])

  if (isSignedOut) return <SignedOutPage />
  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>macekai app</h1>
      {user ? (
        <div>
          <p>
            Welcome, {user.username} ({user.email})
          </p>
          <a href="/logout/">Log out</a>
        </div>
      ) : (
        <div>
          <p>Not signed in.</p>
          <a href="/.auth/login/aad?post_login_redirect_uri=/">Sign in with Microsoft</a>
          {devLogin && (
            <>
              {' '}
              | <a href="/dev-login/">Dev login (local only)</a>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default App
