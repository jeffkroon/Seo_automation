"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, Shield, Trash2, Edit, Globe, FileText } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

interface Client {
  id: string
  naam: string
  website_url: string | null
  notities: string | null
  created_at: string
  updated_at: string | null
}

export default function AdminClientsPage() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentClient, setCurrentClient] = useState<Client | null>(null)
  
  // Form states
  const [naam, setNaam] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [notities, setNotities] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Check if user has owner/admin rights
  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Toegang Geweigerd</h2>
            <p className="text-muted-foreground">
              Alleen bedrijfseigenaren en admins kunnen clients beheren.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient('/api/admin/clients')
      
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fout bij ophalen clients')
      }
    } catch (error) {
      setError('Fout bij ophalen clients')
    } finally {
      setIsLoading(false)
    }
  }

  const openAddDialog = () => {
    setIsEditing(false)
    setCurrentClient(null)
    setNaam("")
    setWebsiteUrl("")
    setNotities("")
    setIsDialogOpen(true)
  }

  const openEditDialog = (client: Client) => {
    setIsEditing(true)
    setCurrentClient(client)
    setNaam(client.naam)
    setWebsiteUrl(client.website_url || "")
    setNotities(client.notities || "")
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!naam.trim()) {
      setError("Naam is verplicht")
      return
    }

    try {
      setIsSaving(true)
      setError("")
      setSuccess("")

      const method = isEditing ? 'PUT' : 'POST'
      const body = isEditing
        ? { id: currentClient?.id, naam, website_url: websiteUrl, notities }
        : { naam, website_url: websiteUrl, notities }

      const response = await apiClient('/api/admin/clients', {
        method,
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setSuccess(isEditing ? 'Client succesvol bijgewerkt!' : 'Client succesvol toegevoegd!')
        setIsDialogOpen(false)
        fetchClients()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fout bij opslaan client')
      }
    } catch (error) {
      setError('Fout bij opslaan client')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (clientId: string, clientNaam: string) => {
    if (!confirm(`Weet je zeker dat je "${clientNaam}" wilt verwijderen?`)) return

    try {
      setError("")
      setSuccess("")

      const response = await apiClient('/api/admin/clients', {
        method: 'DELETE',
        body: JSON.stringify({ id: clientId })
      })

      if (response.ok) {
        setSuccess('Client succesvol verwijderd')
        fetchClients()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fout bij verwijderen client')
      }
    } catch (error) {
      setError('Fout bij verwijderen client')
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Clientbeheer</h1>
            <p className="text-muted-foreground">
              Beheer clients voor {user?.companyName}
            </p>
          </div>
        </div>

        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Client
        </Button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle>Clients ({clients.length})</CardTitle>
          <CardDescription>
            Alle clients waarvoor je content genereert
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Clients ophalen...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Nog geen clients toegevoegd</p>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Voeg je eerste client toe
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{client.naam}</CardTitle>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(client)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {client.website_url && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <a 
                          href={client.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-primary hover:underline truncate"
                        >
                          {client.website_url}
                        </a>
                      </div>
                    )}

                    {client.notities && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p className="line-clamp-2">{client.notities}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(client)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Bewerken
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(client.id, client.naam)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Client Bewerken' : 'Nieuwe Client Toevoegen'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Wijzig de gegevens van deze client.' 
                : 'Voeg een nieuwe client toe aan je bedrijf.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="naam">Naam *</Label>
              <Input
                id="naam"
                placeholder="Bijv. Bakkerij Jansen"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://bakkerijjansen.nl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notities">Notities</Label>
              <Textarea
                id="notities"
                placeholder="Extra informatie over deze client..."
                value={notities}
                onChange={(e) => setNotities(e.target.value)}
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
              {isSaving ? 'Opslaan...' : isEditing ? 'Bijwerken' : 'Toevoegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

