import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { 
  MapPin, 
  Target, 
  ShoppingBag, 
  Wand2, 
  Download, 
  History, 
  Settings,
  Sparkles,
  Image as ImageIcon,
  Palette,
  Grid3X3,
  Loader2
} from 'lucide-react'
import { blink } from '../blink/client'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  displayName?: string
}

interface IconGeneratorDashboardProps {
  user: User
}

interface GeneratedIcon {
  id: string
  url: string
  prompt: string
  category: string
  style: string
  createdAt: string
}

const categories = [
  { value: 'landmark', label: 'Landmarks', icon: MapPin, color: 'bg-blue-500' },
  { value: 'mission', label: 'Missions', icon: Target, color: 'bg-red-500' },
  { value: 'shop', label: 'Shops', icon: ShoppingBag, color: 'bg-green-500' }
]

const styles = [
  { value: 'pixel', label: 'Pixel Art', description: 'Retro 8-bit style icons' },
  { value: 'flat', label: 'Flat Design', description: 'Modern minimalist icons' },
  { value: 'realistic', label: 'Realistic', description: 'Detailed photorealistic icons' },
  { value: 'cartoon', label: 'Cartoon', description: 'Fun animated style icons' },
  { value: 'isometric', label: 'Isometric', description: '3D perspective icons' }
]

export function IconGeneratorDashboard({ user }: IconGeneratorDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedIcons, setGeneratedIcons] = useState<GeneratedIcon[]>([])
  const [generationProgress, setGenerationProgress] = useState(0)
  const [batchCount, setBatchCount] = useState(1)

  const handleGenerateIcon = async () => {
    if (!selectedCategory || !prompt.trim() || !selectedStyle) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const categoryLabel = categories.find(c => c.value === selectedCategory)?.label || selectedCategory
      const styleLabel = styles.find(s => s.value === selectedStyle)?.label || selectedStyle
      
      const enhancedPrompt = `Create a ${styleLabel.toLowerCase()} style icon for a ${categoryLabel.toLowerCase().slice(0, -1)} called "${prompt}". The icon should be suitable for use on a map, with clear details and good contrast. Make it recognizable at small sizes.`

      const { data } = await blink.ai.generateImage({
        prompt: enhancedPrompt,
        size: '1024x1024',
        quality: 'high',
        n: batchCount
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      const newIcons: GeneratedIcon[] = data.map((image, index) => ({
        id: `${Date.now()}-${index}`,
        url: image.url,
        prompt,
        category: selectedCategory,
        style: selectedStyle,
        createdAt: new Date().toISOString()
      }))

      setGeneratedIcons(prev => [...newIcons, ...prev])
      toast.success(`Generated ${batchCount} icon${batchCount > 1 ? 's' : ''} successfully!`)
      
      // Reset form
      setPrompt('')
      setSelectedCategory('')
      setSelectedStyle('')
      setBatchCount(1)
    } catch (error) {
      console.error('Error generating icon:', error)
      toast.error('Failed to generate icon. Please try again.')
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const handleDownloadIcon = async (iconUrl: string, filename: string) => {
    try {
      const response = await fetch(iconUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Icon downloaded successfully!')
    } catch (error) {
      console.error('Error downloading icon:', error)
      toast.error('Failed to download icon')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Map Making Bot</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Icon Generator</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="hidden sm:flex">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
              <div className="text-sm text-muted-foreground">
                Welcome, {user.displayName || user.email}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generation Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Generate Icon
                </CardTitle>
                <CardDescription>
                  Create custom icons for your map landmarks, missions, and shops
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${category.color}`} />
                            <category.icon className="h-4 w-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Prompt Input */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your icon (e.g., 'Ancient castle on a hill', 'Treasure chest quest', 'Magic potion shop')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Style Selection */}
                <div className="space-y-2">
                  <Label>Art Style</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select art style" />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          <div>
                            <div className="font-medium">{style.label}</div>
                            <div className="text-xs text-muted-foreground">{style.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Batch Count */}
                <div className="space-y-2">
                  <Label>Number of Variations</Label>
                  <Select value={batchCount.toString()} onValueChange={(value) => setBatchCount(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((count) => (
                        <SelectItem key={count} value={count.toString()}>
                          {count} icon{count > 1 ? 's' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Generation Progress */}
                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Generating...</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                )}

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerateIcon} 
                  disabled={isGenerating || !selectedCategory || !prompt.trim() || !selectedStyle}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Icon{batchCount > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated Icons */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="gallery" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="gallery" className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Icon Gallery
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gallery" className="space-y-6">
                {generatedIcons.length === 0 ? (
                  <Card className="p-12">
                    <div className="text-center space-y-4">
                      <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">No icons generated yet</h3>
                        <p className="text-muted-foreground">
                          Use the form on the left to generate your first map icon
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {generatedIcons.map((icon) => {
                      const category = categories.find(c => c.value === icon.category)
                      const style = styles.find(s => s.value === icon.style)
                      
                      return (
                        <Card key={icon.id} className="group hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
                              <img
                                src={icon.url}
                                alt={icon.prompt}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                {category && (
                                  <Badge variant="secondary" className="text-xs">
                                    <category.icon className="h-3 w-3 mr-1" />
                                    {category.label}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  <Palette className="h-3 w-3 mr-1" />
                                  {style?.label}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium line-clamp-2">{icon.prompt}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(icon.createdAt).toLocaleDateString()}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadIcon(icon.url, `${icon.prompt.replace(/\\s+/g, '-').toLowerCase()}-${icon.id}`)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Generation History
                    </CardTitle>
                    <CardDescription>
                      Track your icon generation activity and statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary">{generatedIcons.length}</div>
                        <div className="text-sm text-muted-foreground">Total Icons</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-accent">
                          {new Set(generatedIcons.map(i => i.category)).size}
                        </div>
                        <div className="text-sm text-muted-foreground">Categories Used</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {new Set(generatedIcons.map(i => i.style)).size}
                        </div>
                        <div className="text-sm text-muted-foreground">Styles Tried</div>
                      </div>
                    </div>
                    
                    {generatedIcons.length > 0 && (
                      <div className="space-y-4">
                        <Separator />
                        <h4 className="font-medium">Recent Generations</h4>
                        <div className="space-y-2">
                          {generatedIcons.slice(0, 5).map((icon) => {
                            const category = categories.find(c => c.value === icon.category)
                            return (
                              <div key={icon.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                <img src={icon.url} alt={icon.prompt} className="w-10 h-10 rounded object-cover" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{icon.prompt}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {category && <category.icon className="h-3 w-3" />}
                                    <span>{category?.label}</span>
                                    <span>•</span>
                                    <span>{new Date(icon.createdAt).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}