"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Mail, Shield, Trash2, UserPlus } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

interface CompanyUser {
  id: string
  role: string
  users: {
    id: string
    email: string
  }
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState("user")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Check if user has admin rights
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Toegang Geweigerd</h2>
            <p className="text-muted-foreground">
              Je hebt geen admin rechten om gebruikers te beheren.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient('/api/admin/users')
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.memberships || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fout bij ophalen gebruikers')
      }
    } catch (error) {
      setError('Fout bij ophalen gebruikers')
    } finally {
      setIsLoading(false)
    }
  }

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserEmail.trim()) return

    try {
      setIsAdding(true)
      setError("")
      setSuccess("")

      const response = await apiClient('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: newUserEmail.trim(),
          role: newUserRole
        })
      })

      if (response.ok) {
        setSuccess('Gebruiker succesvol toegevoegd!')
        setNewUserEmail("")
        setNewUserRole("user")
        fetchUsers() // Refresh the list
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fout bij toevoegen gebruiker')
      }
    } catch (error) {
      setError('Fout bij toevoegen gebruiker')
    } finally {
      setIsAdding(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-semibold">Gebruikersbeheer</h1>
          <p className="text-muted-foreground">
            Beheer gebruikers voor {user?.companyName}
          </p>
        </div>
      </div>

      {/* Add User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nieuwe Gebruiker Toevoegen
          </CardTitle>
          <CardDescription>
            Voeg een bestaande gebruiker toe aan je bedrijf
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}
          
          <form onSubmit={addUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Adres</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="gebruiker@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Gebruiker</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button type="submit" disabled={isAdding} className="w-full">
                  {isAdding ? (
                    <>
                      <Plus className="h-4 w-4 mr-2 animate-spin" />
                      Toevoegen...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Toevoegen
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Bedrijfsgebruikers</CardTitle>
          <CardDescription>
            Alle gebruikers die toegang hebben tot {user?.companyName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Gebruikers ophalen...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nog geen gebruikers toegevoegd</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{member.users.email}</p>
                      <Badge 
                        variant={member.role === 'owner' ? 'default' : member.role === 'admin' ? 'secondary' : 'outline'}
                        className="mt-1"
                      >
                        {member.role === 'owner' ? 'Eigenaar' : 
                         member.role === 'admin' ? 'Admin' : 'Gebruiker'}
                      </Badge>
                    </div>
                  </div>
                  
                  {member.role !== 'owner' && (
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Verwijderen
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
