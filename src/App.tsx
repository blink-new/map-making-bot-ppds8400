import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { MapMakerDashboard } from './components/MapMakerDashboard'
import { Loader2 } from 'lucide-react'
import { Toaster } from 'sonner'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Interactive Map Maker...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Please sign in</h1>
          <p className="text-muted-foreground">You need to be authenticated to use the Interactive Map Maker</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <MapMakerDashboard user={user} />
      <Toaster />
    </div>
  )
}

export default App