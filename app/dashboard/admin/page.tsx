"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Mail, Shield, Trash2, UserPlus, Send, Copy, CheckCircle, Clock, AlertCircle, Check } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

interface CompanyUser {
  id: string
  role: string
  users: {
    id: string
    email: string
    email_confirmed_at?: string | null
  }
}

interface Invitation {
  id: string
  email: string
  role: string
  created_at: string
  expires_at: string
  used_at: string | null
  invitation_link?: string
}

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("user")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const [usersResponse, invitationsResponse] = await Promise.all([
        apiClient('/api/admin/users'),
        apiClient('/api/admin/invitations')
      ])
      
      if (usersResponse.ok) {
        const data = await usersResponse.json()
        const memberships = data.memberships || []
        
        // Fetch user details separately
        if (memberships.length > 0) {
          const userIds = memberships.map((m: any) => m.user_id)
          const userDetailsResponse = await apiClient('/api/admin/user-details', {
            method: 'POST',
            body: JSON.stringify({ userIds })
          })
          
          if (userDetailsResponse.ok) {
            const userDetailsData = await userDetailsResponse.json()
            const userDetailsMap = new Map(
              userDetailsData.userDetails.map((u: any) => [u.id, u])
            )
            
            // Enrich memberships with user details
            const enrichedMemberships = memberships.map((membership: any) => ({
              ...membership,
              users: userDetailsMap.get(membership.user_id) || {
                id: membership.user_id,
                email: `user-${membership.user_id.substring(0, 8)}`
              }
            }))
            
            setUsers(enrichedMemberships)
          } else {
            setUsers(memberships)
          }
        } else {
          setUsers(memberships)
        }
      } else {
        const errorData = await usersResponse.json()
        setError(errorData.error || 'Fout bij ophalen gebruikers')
      }

      if (invitationsResponse.ok) {
        const data = await invitationsResponse.json()
        setInvitations(data.invitations || [])
      }
    } catch (error) {
      setError('Fout bij ophalen gebruikers')
    } finally {
      setIsLoading(false)
    }
  }


  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    
    try {
      setIsInviting(true)
      setError("")
      setSuccess("")
      
      const response = await apiClient('/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify({ 
          email: inviteEmail.trim(),
          role: inviteRole 
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuccess('Uitnodiging succesvol aangemaakt!')
        setInviteEmail("")
        fetchUsers()
        
        // Show invitation link
        if (data.invitation?.invitation_link) {
          setCopiedLink(data.invitation.invitation_link)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fout bij aanmaken uitnodiging')
      }
    } catch (error) {
      setError('Fout bij aanmaken uitnodiging')
    } finally {
      setIsInviting(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLink(text)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (error) {
      setError('Fout bij kopiëren link')
    }
  }

  const removeUser = async (userId: string) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) return
    
    try {
      setError("")
      setSuccess("")
      
      const response = await apiClient('/api/admin/users', {
        method: 'DELETE',
        body: JSON.stringify({ userId })
      })
      
      if (response.ok) {
        setSuccess('Gebruiker succesvol verwijderd uit het bedrijf')
        fetchUsers()
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || `Fout bij verwijderen gebruiker (${response.status})`)
      }
    } catch (error: any) {
      console.error("Delete user error:", error)
      setError(`Fout bij verwijderen gebruiker: ${error.message || 'Onbekende fout'}`)
    }
  }

  const verifyUser = async (userId: string) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verifiëren?')) return
    
    try {
      setError("")
      setSuccess("")
      
      const response = await apiClient('/api/admin/verify-user', {
        method: 'POST',
        body: JSON.stringify({ userId, action: 'verify' })
      })
      
      if (response.ok) {
        setSuccess('Gebruiker succesvol geverifieerd!')
        fetchUsers()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fout bij verifiëren gebruiker')
      }
    } catch (error: any) {
      console.error("Verify user error:", error)
      setError(`Fout bij verifiëren gebruiker: ${error.message || 'Onbekende fout'}`)
    }
  }

  const resendVerification = async (userId: string) => {
    try {
      setError("")
      setSuccess("")
      
      const response = await apiClient('/api/admin/verify-user', {
        method: 'POST',
        body: JSON.stringify({ userId, action: 'resend' })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuccess(`Verificatie link gegenereerd voor ${data.email}`)
        if (data.verification_link) {
          setCopiedLink(data.verification_link)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fout bij genereren verificatie link')
      }
    } catch (error: any) {
      console.error("Resend verification error:", error)
      setError(`Fout bij genereren verificatie link: ${error.message || 'Onbekende fout'}`)
    }
  }

  const deleteInvitation = async (invitationId: string) => {
    if (!confirm('Weet je zeker dat je deze uitnodiging wilt verwijderen?')) return
    
    try {
      setError("")
      setSuccess("")
      
      const response = await apiClient('/api/admin/invitations', {
        method: 'DELETE',
        body: JSON.stringify({ invitationId })
      })
      
      if (response.ok) {
        setSuccess('Uitnodiging succesvol verwijderd!')
        fetchUsers()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Fout bij verwijderen uitnodiging')
      }
    } catch (error: any) {
      console.error("Delete invitation error:", error)
      setError(`Fout bij verwijderen uitnodiging: ${error.message || 'Onbekende fout'}`)
    }
  }

  useEffect(() => {
    // Only fetch if user is owner
    if (user && user.role === 'owner') {
      fetchUsers()
    }
  }, [user])

  // Check if user has owner rights - AFTER all hooks
  if (!user || user.role !== 'owner') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Toegang Geweigerd</h2>
            <p className="text-muted-foreground">
              Alleen bedrijfseigenaren kunnen gebruikers beheren.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

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

      {/* Send Invitation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Nieuwe Gebruiker Uitnodigen
          </CardTitle>
          <CardDescription>
            Stuur een uitnodiging naar een nieuw email adres. Ze kunnen dan een account aanmaken en worden automatisch toegevoegd aan je bedrijf.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendInvitation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Adres</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="nieuwe@gebruiker.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invite-role">Rol</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Gebruiker</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="viewer">Viewer (Alleen Projecten & Archief)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button type="submit" disabled={isInviting} className="w-full">
                  {isInviting ? (
                    <>
                      <Send className="h-4 w-4 mr-2 animate-spin" />
                      Versturen...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Uitnodiging Versturen
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Show invitation link if created */}
          {copiedLink && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700 mb-2">
                <strong>Uitnodigingslink aangemaakt!</strong> Kopieer deze link en stuur hem naar de gebruiker:
              </p>
              <div className="flex gap-2">
                <Input 
                  value={copiedLink} 
                  readOnly 
                  className="font-mono text-xs"
                />
                <Button 
                  size="sm" 
                  onClick={() => copyToClipboard(copiedLink)}
                  variant="outline"
                >
                  {copiedLink === copiedLink ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lopende Uitnodigingen ({invitations.filter(i => !i.used_at).length})
            </CardTitle>
            <CardDescription>
              Uitnodigingen die nog niet zijn gebruikt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations
                .filter(invitation => !invitation.used_at)
                .map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <Badge variant="secondary" className="mt-1">
                        {invitation.role === 'admin' ? 'Admin' : 'Gebruiker'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Verstuurd: {new Date(invitation.created_at).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-yellow-600">
                      Wachtend
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteInvitation(invitation.id)}
                      title="Uitnodiging verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Bedrijfsgebruikers ({users.length})</CardTitle>
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
              {users.map((member) => {
                const isVerified = !!member.users.email_confirmed_at
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.users.email}</p>
                          {isVerified ? (
                            <CheckCircle className="h-4 w-4 text-green-600" title="Email geverifieerd" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-600" title="Email niet geverifieerd" />
                          )}
                        </div>
                        <div className="flex gap-2 mt-1">
                      <Badge 
                        variant={member.role === 'owner' ? 'default' : member.role === 'admin' ? 'secondary' : 'outline'}
                      >
                        {member.role === 'owner' ? 'Eigenaar' : 
                         member.role === 'admin' ? 'Admin' : 
                         member.role === 'viewer' ? 'Viewer' : 'Gebruiker'}
                      </Badge>
                          {!isVerified && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              Niet geverifieerd
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {!isVerified && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700"
                            onClick={() => verifyUser(member.users.id)}
                            title="Handmatig verifiëren"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Verifiëren
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => resendVerification(member.users.id)}
                            title="Nieuwe verificatie link genereren"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Link
                          </Button>
                        </>
                      )}
                      {member.role !== 'owner' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => removeUser(member.users.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Verwijderen
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}