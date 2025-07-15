import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Slider } from './ui/slider'
import { Switch } from './ui/switch'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { 
  Map, 
  MapPin, 
  Target, 
  ShoppingBag, 
  Users,
  Gem,
  Mountain,
  Trees,
  Waves,
  Zap,
  Download,
  Upload,
  Settings,
  Layers,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Search,
  Filter,
  Sparkles,
  Loader2,
  Home
} from 'lucide-react'
import { blink } from '../blink/client'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  displayName?: string
}

interface MapMakerDashboardProps {
  user: User
}

interface MapLocation {
  id: string
  type: 'mission' | 'landmark' | 'shop' | 'npc' | 'resource'
  name: string
  description: string
  x: number
  y: number
  iconUrl?: string
  properties: Record<string, any>
  visible: boolean
}

interface MapSettings {
  width: number
  height: number
  gridSize: number
  showGrid: boolean
  backgroundColor: string
  terrainType: 'fantasy' | 'modern' | 'sci-fi' | 'medieval'
  biome: 'forest' | 'desert' | 'mountain' | 'ocean' | 'urban' | 'space'
}

const locationTypes = [
  { value: 'mission', label: 'Missions', icon: Target, color: 'bg-red-500' },
  { value: 'landmark', label: 'Landmarks', icon: MapPin, color: 'bg-blue-500' },
  { value: 'shop', label: 'Shops', icon: ShoppingBag, color: 'bg-green-500' },
  { value: 'npc', label: 'NPCs', icon: Users, color: 'bg-purple-500' },
  { value: 'resource', label: 'Resources', icon: Gem, color: 'bg-yellow-500' }
]

const terrainTypes = [
  { value: 'fantasy', label: 'Fantasy', icon: Mountain },
  { value: 'modern', label: 'Modern', icon: Home },
  { value: 'sci-fi', label: 'Sci-Fi', icon: Zap },
  { value: 'medieval', label: 'Medieval', icon: Mountain }
]

const biomes = [
  { value: 'forest', label: 'Forest', icon: Trees, color: '#22c55e' },
  { value: 'desert', label: 'Desert', icon: Mountain, color: '#f59e0b' },
  { value: 'mountain', label: 'Mountain', icon: Mountain, color: '#6b7280' },
  { value: 'ocean', label: 'Ocean', icon: Waves, color: '#3b82f6' },
  { value: 'urban', label: 'Urban', icon: Home, color: '#64748b' },
  { value: 'space', label: 'Space', icon: Zap, color: '#8b5cf6' }
]

export function MapMakerDashboard({ user }: MapMakerDashboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    width: 1200,
    height: 800,
    gridSize: 40,
    showGrid: true,
    backgroundColor: '#f8fafc',
    terrainType: 'fantasy',
    biome: 'forest'
  })
  
  const [locations, setLocations] = useState<MapLocation[]>([])
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null)
  const [isGeneratingTerrain, setIsGeneratingTerrain] = useState(false)
  const [isGeneratingLocations, setIsGeneratingLocations] = useState(false)
  const [terrainImage, setTerrainImage] = useState<HTMLImageElement | null>(null)
  const [terrainImageUrl, setTerrainImageUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showLayers, setShowLayers] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [mapDescription, setMapDescription] = useState('')
  const [locationTypeDistribution, setLocationTypeDistribution] = useState({
    mission: 20,
    landmark: 30,
    shop: 25,
    npc: 15,
    resource: 10
  })

  // New location form state
  const [newLocation, setNewLocation] = useState({
    type: 'landmark' as MapLocation['type'],
    name: '',
    description: '',
    x: 0,
    y: 0
  })

  const [isAddingLocation, setIsAddingLocation] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // Canvas drawing and interaction
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save context
    ctx.save()

    // Apply zoom and pan
    ctx.scale(zoom, zoom)
    ctx.translate(panOffset.x, panOffset.y)

    // Draw terrain image if available, otherwise draw colored background
    if (terrainImage) {
      ctx.drawImage(terrainImage, 0, 0, mapSettings.width, mapSettings.height)
    } else {
      // Draw background with biome color
      const biome = biomes.find(b => b.value === mapSettings.biome)
      ctx.fillStyle = biome?.color || mapSettings.backgroundColor
      ctx.fillRect(0, 0, mapSettings.width, mapSettings.height)
      
      // Add some basic terrain patterns when no image is available
      ctx.globalAlpha = 0.1
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * mapSettings.width
        const y = Math.random() * mapSettings.height
        const size = Math.random() * 30 + 10
        
        ctx.beginPath()
        ctx.arc(x, y, size, 0, 2 * Math.PI)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    // Draw grid
    if (mapSettings.showGrid) {
      ctx.strokeStyle = terrainImage ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)'
      ctx.lineWidth = 1
      
      for (let x = 0; x <= mapSettings.width; x += mapSettings.gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, mapSettings.height)
        ctx.stroke()
      }
      
      for (let y = 0; y <= mapSettings.height; y += mapSettings.gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(mapSettings.width, y)
        ctx.stroke()
      }
    }

    // Draw locations
    locations.forEach(location => {
      if (!location.visible) return

      const locationType = locationTypes.find(t => t.value === location.type)
      
      // Draw location background circle (larger)
      ctx.beginPath()
      ctx.arc(location.x, location.y, 16, 0, 2 * Math.PI)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.lineWidth = 1
      ctx.stroke()
      
      // Draw location type circle
      ctx.beginPath()
      ctx.arc(location.x, location.y, 12, 0, 2 * Math.PI)
      
      // Convert Tailwind color to hex
      let color = '#3b82f6'
      if (locationType?.color === 'bg-red-500') color = '#ef4444'
      else if (locationType?.color === 'bg-blue-500') color = '#3b82f6'
      else if (locationType?.color === 'bg-green-500') color = '#22c55e'
      else if (locationType?.color === 'bg-purple-500') color = '#a855f7'
      else if (locationType?.color === 'bg-yellow-500') color = '#eab308'
      
      ctx.fillStyle = color
      ctx.fill()
      
      // Draw selection highlight
      if (selectedLocation?.id === location.id) {
        ctx.beginPath()
        ctx.arc(location.x, location.y, 20, 0, 2 * Math.PI)
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 3
        ctx.stroke()
        
        // Add pulsing effect
        ctx.beginPath()
        ctx.arc(location.x, location.y, 24, 0, 2 * Math.PI)
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
        ctx.lineWidth = 2
        ctx.stroke()
      }
      
      // Draw location icon (simplified)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 10px Inter'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      let iconText = '?'
      if (location.type === 'mission') iconText = '⚔'
      else if (location.type === 'landmark') iconText = '🏛'
      else if (location.type === 'shop') iconText = '🏪'
      else if (location.type === 'npc') iconText = '👤'
      else if (location.type === 'resource') iconText = '💎'
      
      ctx.fillText(iconText, location.x, location.y)
      
      // Draw location name with background
      ctx.font = '11px Inter'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      
      const textY = location.y + 28
      const textWidth = ctx.measureText(location.name).width
      
      // Text background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(location.x - textWidth/2 - 4, textY - 2, textWidth + 8, 16)
      
      // Text
      ctx.fillStyle = 'white'
      ctx.fillText(location.name, location.x, textY)
    })

    // Restore context
    ctx.restore()
  }, [mapSettings, locations, zoom, panOffset, selectedLocation, terrainImage])

  useEffect(() => {
    drawMap()
  }, [drawMap])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left - panOffset.x * zoom) / zoom
    const y = (event.clientY - rect.top - panOffset.y * zoom) / zoom

    if (isAddingLocation) {
      setNewLocation(prev => ({ ...prev, x, y }))
      return
    }

    // Check if clicked on a location
    const clickedLocation = locations.find(location => {
      const distance = Math.sqrt((location.x - x) ** 2 + (location.y - y) ** 2)
      return distance <= 12 && location.visible
    })

    setSelectedLocation(clickedLocation || null)
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAddingLocation) return
    
    setIsDragging(true)
    setDragStart({ x: event.clientX, y: event.clientY })
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return

    const deltaX = event.clientX - dragStart.x
    const deltaY = event.clientY - dragStart.y

    setPanOffset(prev => ({
      x: prev.x + deltaX / zoom,
      y: prev.y + deltaY / zoom
    }))

    setDragStart({ x: event.clientX, y: event.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const generateTerrain = async () => {
    setIsGeneratingTerrain(true)
    try {
      const biome = biomes.find(b => b.value === mapSettings.biome)
      const terrain = terrainTypes.find(t => t.value === mapSettings.terrainType)
      
      const prompt = `Create a detailed top-down ${terrain?.label.toLowerCase()} ${biome?.label.toLowerCase()} terrain map for a game. Include varied terrain features like paths, clearings, water bodies, elevation changes, and natural landmarks. Style should be suitable for placing game locations like missions, shops, and landmarks. High detail, game-ready terrain texture.`
      
      const { data } = await blink.ai.generateImage({
        prompt,
        size: '1024x1024',
        quality: 'high',
        n: 1
      })

      if (data && data[0]?.url) {
        const imageUrl = data[0].url
        setTerrainImageUrl(imageUrl)
        
        // Load the image
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          setTerrainImage(img)
          toast.success('Terrain generated and loaded successfully!')
        }
        img.onerror = () => {
          toast.error('Failed to load generated terrain image')
        }
        img.src = imageUrl
      } else {
        toast.error('No terrain image was generated')
      }
    } catch (error) {
      console.error('Error generating terrain:', error)
      toast.error('Failed to generate terrain')
    } finally {
      setIsGeneratingTerrain(false)
    }
  }

  // Analyze terrain to find suitable placement areas
  const analyzeTerrainForPlacement = () => {
    if (!terrainImage) {
      // If no terrain image, use basic placement logic
      return {
        suitableAreas: [],
        avoidAreas: []
      }
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return { suitableAreas: [], avoidAreas: [] }

    canvas.width = mapSettings.width
    canvas.height = mapSettings.height
    ctx.drawImage(terrainImage, 0, 0, mapSettings.width, mapSettings.height)

    const imageData = ctx.getImageData(0, 0, mapSettings.width, mapSettings.height)
    const data = imageData.data

    const suitableAreas: { x: number; y: number; score: number }[] = []
    const avoidAreas: { x: number; y: number; radius: number }[] = []

    // Sample points across the terrain
    const sampleSize = 20
    for (let x = sampleSize; x < mapSettings.width - sampleSize; x += sampleSize) {
      for (let y = sampleSize; y < mapSettings.height - sampleSize; y += sampleSize) {
        const index = (y * mapSettings.width + x) * 4
        const r = data[index]
        const g = data[index + 1]
        const b = data[index + 2]

        // Calculate brightness and color characteristics
        const brightness = (r + g + b) / 3
        const isWater = b > r + 30 && b > g + 30 // Bluish areas
        const isVeryDark = brightness < 50 // Very dark areas (cliffs, deep shadows)
        const isVeryBright = brightness > 200 // Very bright areas (snow, sand)

        // Score based on suitability for different location types
        let score = 100

        if (isWater) {
          score -= 80 // Avoid water for most locations
          avoidAreas.push({ x, y, radius: 30 })
        } else if (isVeryDark) {
          score -= 60 // Avoid very dark areas
        } else if (isVeryBright) {
          score -= 20 // Slightly avoid very bright areas
        }

        // Prefer areas with moderate brightness (clearings, paths)
        if (brightness >= 80 && brightness <= 160) {
          score += 30
        }

        // Add some randomness for natural placement
        score += Math.random() * 20 - 10

        if (score > 40) {
          suitableAreas.push({ x, y, score })
        }
      }
    }

    // Sort by score (best first)
    suitableAreas.sort((a, b) => b.score - a.score)

    return { suitableAreas, avoidAreas }
  }

  // Smart placement algorithm that considers terrain and existing locations
  const findOptimalPlacement = (locationType: string, existingLocations: MapLocation[], terrainAnalysis: any) => {
    const { suitableAreas, avoidAreas } = terrainAnalysis
    
    // If no terrain analysis available, use random placement with some logic
    if (suitableAreas.length === 0) {
      let attempts = 0
      while (attempts < 50) {
        const x = Math.random() * (mapSettings.width - 100) + 50
        const y = Math.random() * (mapSettings.height - 100) + 50
        
        // Check distance from existing locations
        const tooClose = existingLocations.some(loc => {
          const distance = Math.sqrt((loc.x - x) ** 2 + (loc.y - y) ** 2)
          return distance < 80 // Minimum distance between locations
        })
        
        if (!tooClose) {
          return { x, y }
        }
        attempts++
      }
      return { x: Math.random() * (mapSettings.width - 100) + 50, y: Math.random() * (mapSettings.height - 100) + 50 }
    }

    // Use terrain analysis for smart placement
    for (const area of suitableAreas) {
      // Check if area is suitable for this location type
      let typeBonus = 0
      if (locationType === 'landmark' && area.score > 80) typeBonus = 20
      if (locationType === 'shop' && area.score > 60 && area.score < 90) typeBonus = 15
      if (locationType === 'mission' && area.score > 70) typeBonus = 10
      if (locationType === 'resource' && area.score > 50) typeBonus = 25
      if (locationType === 'npc' && area.score > 60) typeBonus = 15

      const finalScore = area.score + typeBonus

      // Check distance from existing locations
      const tooClose = existingLocations.some(loc => {
        const distance = Math.sqrt((loc.x - area.x) ** 2 + (loc.y - area.y) ** 2)
        return distance < 80
      })

      // Check if in avoid areas
      const inAvoidArea = avoidAreas.some(avoid => {
        const distance = Math.sqrt((avoid.x - area.x) ** 2 + (avoid.y - area.y) ** 2)
        return distance < avoid.radius
      })

      if (!tooClose && !inAvoidArea && finalScore > 50) {
        // Add some randomness around the optimal point
        const offsetX = (Math.random() - 0.5) * 40
        const offsetY = (Math.random() - 0.5) * 40
        return {
          x: Math.max(50, Math.min(mapSettings.width - 50, area.x + offsetX)),
          y: Math.max(50, Math.min(mapSettings.height - 50, area.y + offsetY))
        }
      }
    }

    // Fallback to random placement if no suitable area found
    return { x: Math.random() * (mapSettings.width - 100) + 50, y: Math.random() * (mapSettings.height - 100) + 50 }
  }

  const generateLocations = async () => {
    setIsGeneratingLocations(true)
    try {
      const biome = biomes.find(b => b.value === mapSettings.biome)
      const terrain = terrainTypes.find(t => t.value === mapSettings.terrainType)
      
      const baseDescription = mapDescription.trim() || `A ${terrain?.label.toLowerCase()} ${biome?.label.toLowerCase()} game map`
      const distributionText = `Generate approximately ${locationTypeDistribution.mission}% missions, ${locationTypeDistribution.landmark}% landmarks, ${locationTypeDistribution.shop}% shops, ${locationTypeDistribution.npc}% NPCs, and ${locationTypeDistribution.resource}% resources`
      
      const prompt = `Generate a list of 8-12 diverse locations for: ${baseDescription}. ${distributionText}. Each location should have a name and brief description suitable for the setting and theme. Consider the terrain type and biome when naming locations.`
      
      const { object } = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: {
            locations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['mission', 'landmark', 'shop', 'npc', 'resource'] },
                  name: { type: 'string' },
                  description: { type: 'string' }
                },
                required: ['type', 'name', 'description']
              }
            }
          },
          required: ['locations']
        }
      })

      // Analyze terrain for intelligent placement
      const terrainAnalysis = analyzeTerrainForPlacement()
      
      const newLocations: MapLocation[] = []
      const existingLocations = [...locations]

      object.locations.forEach((loc: any, index: number) => {
        const placement = findOptimalPlacement(loc.type, [...existingLocations, ...newLocations], terrainAnalysis)
        
        const location: MapLocation = {
          id: `generated-${Date.now()}-${index}`,
          type: loc.type,
          name: loc.name,
          description: loc.description,
          x: placement.x,
          y: placement.y,
          properties: {},
          visible: true
        }
        
        newLocations.push(location)
      })

      setLocations(prev => [...prev, ...newLocations])
      
      const terrainText = terrainImage ? ' with intelligent terrain analysis' : ''
      toast.success(`Generated ${newLocations.length} locations${terrainText}!`)
    } catch (error) {
      console.error('Error generating locations:', error)
      toast.error('Failed to generate locations')
    } finally {
      setIsGeneratingLocations(false)
    }
  }

  const addLocation = () => {
    if (!newLocation.name.trim()) {
      toast.error('Please enter a location name')
      return
    }

    const location: MapLocation = {
      id: `location-${Date.now()}`,
      type: newLocation.type,
      name: newLocation.name,
      description: newLocation.description,
      x: newLocation.x,
      y: newLocation.y,
      properties: {},
      visible: true
    }

    setLocations(prev => [...prev, location])
    setNewLocation({ type: 'landmark', name: '', description: '', x: 0, y: 0 })
    setIsAddingLocation(false)
    toast.success('Location added successfully!')
  }

  const deleteLocation = (id: string) => {
    setLocations(prev => prev.filter(loc => loc.id !== id))
    if (selectedLocation?.id === id) {
      setSelectedLocation(null)
    }
    toast.success('Location deleted')
  }

  const toggleLocationVisibility = (id: string) => {
    setLocations(prev => prev.map(loc => 
      loc.id === id ? { ...loc, visible: !loc.visible } : loc
    ))
  }

  const exportMap = () => {
    const mapData = {
      settings: mapSettings,
      locations: locations,
      metadata: {
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        version: '1.0'
      }
    }

    const blob = new Blob([JSON.stringify(mapData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'map-data.json'
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success('Map exported successfully!')
  }

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || location.type === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Map className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Interactive Map Maker</h1>
                <p className="text-sm text-muted-foreground">AI-Powered World Builder</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="hidden sm:flex">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
              <Button onClick={exportMap} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <div className="text-sm text-muted-foreground">
                Welcome, {user.displayName || user.email}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Controls */}
        <div className="w-80 border-r bg-card/50 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Map Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Map Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Width</Label>
                      <Input
                        type="number"
                        value={mapSettings.width}
                        onChange={(e) => setMapSettings(prev => ({ ...prev, width: parseInt(e.target.value) || 1200 }))}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Height</Label>
                      <Input
                        type="number"
                        value={mapSettings.height}
                        onChange={(e) => setMapSettings(prev => ({ ...prev, height: parseInt(e.target.value) || 800 }))}
                        className="h-8"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Terrain Type</Label>
                    <Select value={mapSettings.terrainType} onValueChange={(value: any) => setMapSettings(prev => ({ ...prev, terrainType: value }))}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {terrainTypes.map(terrain => (
                          <SelectItem key={terrain.value} value={terrain.value}>
                            <div className="flex items-center gap-2">
                              <terrain.icon className="h-3 w-3" />
                              {terrain.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Biome</Label>
                    <Select value={mapSettings.biome} onValueChange={(value: any) => setMapSettings(prev => ({ ...prev, biome: value }))}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {biomes.map(biome => (
                          <SelectItem key={biome.value} value={biome.value}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: biome.color }} />
                              <biome.icon className="h-3 w-3" />
                              {biome.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Show Grid</Label>
                    <Switch
                      checked={mapSettings.showGrid}
                      onCheckedChange={(checked) => setMapSettings(prev => ({ ...prev, showGrid: checked }))}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Grid Size: {mapSettings.gridSize}px</Label>
                    <Slider
                      value={[mapSettings.gridSize]}
                      onValueChange={([value]) => setMapSettings(prev => ({ ...prev, gridSize: value }))}
                      min={20}
                      max={100}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Map Description */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Map Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Describe your map</Label>
                    <Textarea
                      value={mapDescription}
                      onChange={(e) => setMapDescription(e.target.value)}
                      placeholder="e.g., A mystical forest kingdom with ancient ruins, magical creatures, and hidden treasures..."
                      rows={3}
                      className="text-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location Type Distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Location Types
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Adjust the distribution of location types
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {locationTypes.map(type => (
                    <div key={type.value} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <type.icon className="h-3 w-3" />
                          <Label className="text-xs">{type.label}</Label>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {locationTypeDistribution[type.value as keyof typeof locationTypeDistribution]}%
                        </span>
                      </div>
                      <Slider
                        value={[locationTypeDistribution[type.value as keyof typeof locationTypeDistribution]]}
                        onValueChange={([value]) => setLocationTypeDistribution(prev => ({ ...prev, [type.value]: value }))}
                        min={0}
                        max={50}
                        step={5}
                        className="h-1"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Terrain Preview */}
              {terrainImageUrl && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mountain className="h-4 w-4" />
                      Generated Terrain
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img
                        src={terrainImageUrl}
                        alt="Generated terrain"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {mapSettings.terrainType} • {mapSettings.biome}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI Generation */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Generation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={generateTerrain}
                    disabled={isGeneratingTerrain}
                    className="w-full h-8"
                    size="sm"
                  >
                    {isGeneratingTerrain ? (
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <Mountain className="h-3 w-3 mr-2" />
                    )}
                    {terrainImage ? 'Regenerate Terrain' : 'Generate Terrain'}
                  </Button>
                  
                  <Button
                    onClick={generateLocations}
                    disabled={isGeneratingLocations || (!terrainImage && locations.length === 0)}
                    className="w-full h-8"
                    size="sm"
                    variant="outline"
                  >
                    {isGeneratingLocations ? (
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <MapPin className="h-3 w-3 mr-2" />
                    )}
                    Generate Locations
                  </Button>
                  
                  {!terrainImage && (
                    <div className="text-xs text-muted-foreground">
                      💡 Generate terrain first for intelligent location placement
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Location */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!isAddingLocation ? (
                    <Button
                      onClick={() => setIsAddingLocation(true)}
                      className="w-full h-8"
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Add New Location
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select value={newLocation.type} onValueChange={(value: any) => setNewLocation(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {locationTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="h-3 w-3" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={newLocation.name}
                          onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Location name"
                          className="h-8"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={newLocation.description}
                          onChange={(e) => setNewLocation(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description"
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Click on the map to place this location
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={addLocation} size="sm" className="flex-1 h-8">
                          <Save className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                        <Button
                          onClick={() => setIsAddingLocation(false)}
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Controls */}
          <div className="border-b bg-card/50 p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}
                size="sm"
                variant="outline"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.1))}
                size="sm"
                variant="outline"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button
                onClick={() => {
                  setZoom(1)
                  setPanOffset({ x: 0, y: 0 })
                }}
                size="sm"
                variant="outline"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <span className="text-xs text-muted-foreground">
                Zoom: {Math.round(zoom * 100)}%
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowLayers(!showLayers)}
                size="sm"
                variant={showLayers ? "default" : "outline"}
              >
                <Layers className="h-3 w-3 mr-1" />
                Layers
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-hidden bg-muted/20 relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="cursor-crosshair"
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            
            {isAddingLocation && (
              <div className="absolute top-4 left-4 bg-card border rounded-lg p-3 shadow-lg">
                <div className="text-sm font-medium">Adding Location</div>
                <div className="text-xs text-muted-foreground">
                  Click on the map to place "{newLocation.name}"
                </div>
              </div>
            )}

            {/* Bottom Right Edit Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
              <Button
                onClick={() => setEditMode(!editMode)}
                size="sm"
                variant={editMode ? "default" : "outline"}
                className="shadow-lg"
              >
                <Edit className="h-3 w-3 mr-2" />
                {editMode ? 'Exit Edit' : 'Edit Mode'}
              </Button>
              
              {editMode && (
                <div className="bg-card border rounded-lg p-3 shadow-lg space-y-2 min-w-[200px]">
                  <div className="text-sm font-medium">Edit Controls</div>
                  <div className="space-y-2">
                    <Button
                      onClick={() => setIsAddingLocation(true)}
                      size="sm"
                      variant="outline"
                      className="w-full justify-start h-8"
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Add Location
                    </Button>
                    
                    {selectedLocation && (
                      <>
                        <Button
                          onClick={() => {
                            setNewLocation({
                              type: selectedLocation.type,
                              name: selectedLocation.name,
                              description: selectedLocation.description,
                              x: selectedLocation.x,
                              y: selectedLocation.y
                            })
                            setIsAddingLocation(true)
                            deleteLocation(selectedLocation.id)
                          }}
                          size="sm"
                          variant="outline"
                          className="w-full justify-start h-8"
                        >
                          <Edit className="h-3 w-3 mr-2" />
                          Edit Selected
                        </Button>
                        
                        <Button
                          onClick={() => deleteLocation(selectedLocation.id)}
                          size="sm"
                          variant="outline"
                          className="w-full justify-start h-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete Selected
                        </Button>
                        
                        <Button
                          onClick={() => toggleLocationVisibility(selectedLocation.id)}
                          size="sm"
                          variant="outline"
                          className="w-full justify-start h-8"
                        >
                          {selectedLocation.visible ? (
                            <>
                              <EyeOff className="h-3 w-3 mr-2" />
                              Hide Selected
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-2" />
                              Show Selected
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    
                    <Separator />
                    
                    <Button
                      onClick={() => {
                        setLocations([])
                        setSelectedLocation(null)
                        toast.success('All locations cleared')
                      }}
                      size="sm"
                      variant="outline"
                      className="w-full justify-start h-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Clear All
                    </Button>
                  </div>
                  
                  {selectedLocation && (
                    <div className="pt-2 border-t">
                      <div className="text-xs font-medium mb-1">Selected:</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedLocation.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({Math.round(selectedLocation.x)}, {Math.round(selectedLocation.y)})
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Layers & Locations */}
        {showLayers && (
          <div className="w-80 border-l bg-card/50 overflow-hidden flex flex-col">
            <div className="border-b p-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4" />
                <h3 className="font-medium">Locations</h3>
                <Badge variant="secondary" className="ml-auto">
                  {locations.length}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="relative">
                  <Search className="h-3 w-3 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {locationTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-3 w-3" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {filteredLocations.map(location => {
                  const locationType = locationTypes.find(t => t.value === location.type)
                  const isSelected = selectedLocation?.id === location.id
                  
                  return (
                    <div
                      key={location.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedLocation(location)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {locationType && <locationType.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{location.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {location.description}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {locationType?.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                ({Math.round(location.x)}, {Math.round(location.y)})
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleLocationVisibility(location.id)
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                          >
                            {location.visible ? (
                              <Eye className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteLocation(location.id)
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {filteredLocations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No locations found</div>
                    <div className="text-xs">
                      {searchTerm || filterType !== 'all' 
                        ? 'Try adjusting your search or filter'
                        : 'Add locations or generate them with AI'
                      }
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}