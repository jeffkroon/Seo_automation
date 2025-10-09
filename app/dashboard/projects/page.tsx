"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Folder, Plus, Users, FileText, Trash2, Edit, UserPlus, FolderOpen } from "lucide-react"
import { useClientContext } from "@/hooks/use-client-context"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface Project {
  id: string
  name: string
  description: string | null
  client_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const { selectedClient, clients } = useClientContext()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  
  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (selectedClient) {
      fetchProjects()
    }
  }, [selectedClient])

  const fetchProjects = async () => {
    if (!selectedClient) return

    try {
      setIsLoading(true)
      const response = await apiClient(`/api/projects?client_id=${selectedClient.id}`)

      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setIsEditing(false)
    setCurrentProject(null)
    setName("")
    setDescription("")
    setIsDialogOpen(true)
  }

  const openEditDialog = (project: Project) => {
    setIsEditing(true)
    setCurrentProject(project)
    setName(project.name)
    setDescription(project.description || "")
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Project naam is verplicht")
      return
    }

    try {
      setIsSaving(true)

      const method = isEditing ? 'PATCH' : 'POST'
      const body: any = {
        name,
        description,
        client_id: selectedClient?.id
      }

      if (isEditing && currentProject) {
        body.id = currentProject.id
      }

      const response = await apiClient('/api/projects', {
        method,
        body: JSON.stringify(body)
      })

      if (response.ok) {
        alert(isEditing ? 'Project bijgewerkt!' : 'Project aangemaakt!')
        setIsDialogOpen(false)
        fetchProjects()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Fout bij opslaan')
      }
    } catch (error) {
      console.error('Failed to save project:', error)
      alert('Fout bij opslaan project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (projectId: string, projectName: string) => {
    if (!confirm(`Weet je zeker dat je "${projectName}" wilt verwijderen?`)) return

    try {
      const response = await apiClient('/api/projects', {
        method: 'DELETE',
        body: JSON.stringify({ id: projectId })
      })

      if (response.ok) {
        alert('Project verwijderd!')
        fetchProjects()
      } else {
        alert('Fout bij verwijderen')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Fout bij verwijderen')
    }
  }

  if (!selectedClient) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Geen client geselecteerd</h2>
            <p className="text-muted-foreground">
              Selecteer een client in de sidebar om projecten te beheren.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Folder className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Projecten</h1>
            <p className="text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? 'en' : ''} voor {selectedClient.naam}
            </p>
          </div>
        </div>

        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Nieuw Project
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nog geen projecten</h2>
            <p className="text-muted-foreground mb-4">
              Maak je eerste project aan om artikelen en teamleden te organiseren
            </p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Nieuw Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Folder className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg leading-tight truncate">
                        {project.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(project.created_at), 'dd MMM yyyy', { locale: nl })}
                      </p>
                    </div>
                  </div>
                </div>
                {project.description && (
                  <CardDescription className="line-clamp-2 mt-2">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Members
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Artikelen
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      openEditDialog(project)
                    }}
                    className="w-full"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Bewerken
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(project.id, project.name)
                    }}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Verwijder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Project Bewerken' : 'Nieuw Project'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Wijzig de gegevens van dit project.' 
                : 'Maak een nieuw project aan om artikelen en teamleden te organiseren.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Naam *</Label>
              <Input
                id="name"
                placeholder="Bijv. Q4 Content Campagne"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                placeholder="Optionele beschrijving van het project..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Annuleren
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Opslaan...' : isEditing ? 'Bijwerken' : 'Aanmaken'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

