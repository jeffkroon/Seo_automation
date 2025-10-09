"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Folder, Users, FileText, UserPlus, Plus, Trash2, ArrowLeft, Download, Eye } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface Project {
  id: string
  name: string
  description: string | null
  created_at: string
}

interface Member {
  id: string
  member_id: string
  role: string
  added_at: string
}

interface ProjectArticle {
  id: string
  article_id: string
  added_at: string
}

interface Article {
  id: string
  title: string
  focus_keyword: string
  created_at: string
  article_type: string | null
}

interface TeamMember {
  id: string
  email: string
}

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [projectArticles, setProjectArticles] = useState<ProjectArticle[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [availableArticles, setAvailableArticles] = useState<Article[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Dialog states
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false)
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [selectedArticleId, setSelectedArticleId] = useState("")
  const [memberRole, setMemberRole] = useState("member")

  useEffect(() => {
    fetchProjectData()
  }, [params.projectId])

  const fetchProjectData = async () => {
    setIsLoading(true)
    await Promise.all([
      fetchProject(),
      fetchMembers(),
      fetchProjectArticles(),
      fetchAvailableArticles(),
      fetchTeamMembers()
    ])
    setIsLoading(false)
  }

  const fetchProject = async () => {
    try {
      const response = await apiClient(`/api/projects`)
      if (response.ok) {
        const data = await response.json()
        const proj = data.projects.find((p: Project) => p.id === params.projectId)
        setProject(proj || null)
      }
    } catch (error) {
      console.error('Error fetching project:', error)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await apiClient(`/api/projects/${params.projectId}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const fetchProjectArticles = async () => {
    try {
      const response = await apiClient(`/api/projects/${params.projectId}/articles`)
      if (response.ok) {
        const data = await response.json()
        setProjectArticles(data.articles || [])
        
        // Fetch full article details
        if (data.articles && data.articles.length > 0) {
          const articleIds = data.articles.map((a: ProjectArticle) => a.article_id)
          const articlesResponse = await apiClient(`/api/articles`)
          if (articlesResponse.ok) {
            const articlesData = await articlesResponse.json()
            const filtered = articlesData.articles.filter((a: Article) => 
              articleIds.includes(a.id)
            )
            setArticles(filtered)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching project articles:', error)
    }
  }

  const fetchAvailableArticles = async () => {
    try {
      const response = await apiClient(`/api/articles`)
      if (response.ok) {
        const data = await response.json()
        setAvailableArticles(data.articles || [])
      }
    } catch (error) {
      console.error('Error fetching available articles:', error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await apiClient(`/api/admin/users`)
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const handleAddMember = async () => {
    if (!selectedMemberId) {
      alert('Selecteer een teamlid')
      return
    }

    try {
      const response = await apiClient(`/api/projects/${params.projectId}/members`, {
        method: 'POST',
        body: JSON.stringify({
          member_id: selectedMemberId,
          role: memberRole
        })
      })

      if (response.ok) {
        alert('Member toegevoegd!')
        setIsMemberDialogOpen(false)
        setSelectedMemberId("")
        setMemberRole("member")
        fetchMembers()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Fout bij toevoegen member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Fout bij toevoegen member')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Weet je zeker dat je dit lid wilt verwijderen?')) return

    try {
      const response = await apiClient(`/api/projects/${params.projectId}/members`, {
        method: 'DELETE',
        body: JSON.stringify({ member_id: memberId })
      })

      if (response.ok) {
        alert('Member verwijderd!')
        fetchMembers()
      } else {
        alert('Fout bij verwijderen')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Fout bij verwijderen')
    }
  }

  const handleAddArticle = async () => {
    if (!selectedArticleId) {
      alert('Selecteer een artikel')
      return
    }

    try {
      const response = await apiClient(`/api/projects/${params.projectId}/articles`, {
        method: 'POST',
        body: JSON.stringify({ article_id: selectedArticleId })
      })

      if (response.ok) {
        alert('Artikel toegevoegd!')
        setIsArticleDialogOpen(false)
        setSelectedArticleId("")
        fetchProjectArticles()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Fout bij toevoegen artikel')
      }
    } catch (error) {
      console.error('Error adding article:', error)
      alert('Fout bij toevoegen artikel')
    }
  }

  const handleRemoveArticle = async (articleId: string) => {
    if (!confirm('Weet je zeker dat je dit artikel wilt verwijderen uit het project?')) return

    try {
      const response = await apiClient(`/api/projects/${params.projectId}/articles`, {
        method: 'DELETE',
        body: JSON.stringify({ article_id: articleId })
      })

      if (response.ok) {
        alert('Artikel verwijderd!')
        fetchProjectArticles()
      } else {
        alert('Fout bij verwijderen')
      }
    } catch (error) {
      console.error('Error removing article:', error)
      alert('Fout bij verwijderen')
    }
  }

  const downloadArticle = (article: Article) => {
    // Simple download - in real app would fetch full content
    const content = `# ${article.title}\n\nKeyword: ${article.focus_keyword}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Project niet gevonden</h2>
            <Button onClick={() => router.push('/dashboard/projects')}>
              Terug naar projecten
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const availableMembersForAdd = teamMembers.filter(
    tm => !members.some(m => m.member_id === tm.id)
  )

  const availableArticlesForAdd = availableArticles.filter(
    aa => !projectArticles.some(pa => pa.article_id === aa.id)
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/projects')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Terug
          </Button>
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Folder className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="articles" className="gap-2">
            <FileText className="h-4 w-4" />
            Artikelen ({articles.length})
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            Members ({members.length})
          </TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Beheer de artikelen in dit project
            </p>
            <Button onClick={() => setIsArticleDialogOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Artikel Toevoegen
            </Button>
          </div>

          {articles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nog geen artikelen in dit project</p>
                <Button onClick={() => setIsArticleDialogOpen(true)} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Eerste Artikel Toevoegen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article) => (
                <Card key={article.id} className="group hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant={article.article_type === 'transactioneel' ? 'default' : 'secondary'}>
                        {article.article_type || 'Onbekend'}
                      </Badge>
                    </div>
                    <CardTitle className="text-base leading-tight line-clamp-2">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {article.focus_keyword}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadArticle(article)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveArticle(article.id)}
                        className="text-red-600 hover:text-red-700"
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
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Beheer de teamleden die toegang hebben tot dit project
            </p>
            <Button onClick={() => setIsMemberDialogOpen(true)} size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Member Toevoegen
            </Button>
          </div>

          {members.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nog geen members in dit project</p>
                <Button onClick={() => setIsMemberDialogOpen(true)} className="mt-4 gap-2">
                  <UserPlus className="h-4 w-4" />
                  Eerste Member Toevoegen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => {
                const memberInfo = teamMembers.find(tm => tm.id === member.member_id)
                return (
                  <Card key={member.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-sm">
                              {memberInfo?.email || member.member_id}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs mt-1">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.member_id)}
                        className="w-full text-red-600 hover:text-red-700"
                        disabled={member.member_id === user?.id}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Verwijder
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Member Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Member Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een teamlid toe aan dit project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Teamlid</label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een teamlid" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembersForAdd.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <Select value={memberRole} onValueChange={setMemberRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAddMember}>
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Article Dialog */}
      <Dialog open={isArticleDialogOpen} onOpenChange={setIsArticleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Artikel Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een artikel toe aan dit project
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Artikel</label>
              <Select value={selectedArticleId} onValueChange={setSelectedArticleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een artikel" />
                </SelectTrigger>
                <SelectContent>
                  {availableArticlesForAdd.map((article) => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsArticleDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleAddArticle}>
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

