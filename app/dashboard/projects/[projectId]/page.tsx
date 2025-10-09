"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Folder, Users, FileText, UserPlus, Plus, Trash2, ArrowLeft, Download, Eye, X, ExternalLink, Search, Calendar, Hash, Tag } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

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
  content_article: string | null
  content_faq: string | null
  article_type: string | null
  country: string | null
  language: string | null
  additional_keywords: string[]
  additional_headings: string[]
  created_at: string
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
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

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
            console.log('📄 Project articles loaded:', filtered.length)
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
      console.log('🔍 Fetching team members...')
      const response = await apiClient(`/api/admin/users`)
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Users API response:', data)
        const memberships = data.memberships || []
        
        // Fetch user details for all memberships
        if (memberships.length > 0) {
          const userIds = memberships.map((m: any) => m.user_id)
          console.log('🔍 Fetching details for user IDs:', userIds)
          
          const userDetailsResponse = await apiClient('/api/admin/user-details', {
            method: 'POST',
            body: JSON.stringify({ userIds })
          })
          
          if (userDetailsResponse.ok) {
            const userDetailsData = await userDetailsResponse.json()
            console.log('✅ User details fetched:', userDetailsData.userDetails)
            setTeamMembers(userDetailsData.userDetails || [])
          } else {
            console.error('❌ Failed to fetch user details:', userDetailsResponse.status)
            setTeamMembers([])
          }
        } else {
          console.log('⚠️ No memberships found')
          setTeamMembers([])
        }
      } else {
        console.error('❌ Failed to fetch users:', response.status)
      }
    } catch (error) {
      console.error('❌ Error fetching team members:', error)
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

  const openSidePanel = (article: Article) => {
    setSelectedArticle(article)
    setSidePanelOpen(true)
  }

  const closeSidePanel = () => {
    setSidePanelOpen(false)
    setSelectedArticle(null)
  }

  const downloadArticle = (article: Article) => {
    const content = `# ${article.title}\n\n${article.content_article || ''}\n\n---\n\n${article.content_faq || ''}`
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Card key={article.id} className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    {/* Header with badge and date */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={article.article_type === 'transactioneel' ? 'default' : 'secondary'} 
                          className="text-xs font-medium px-2 py-1"
                        >
                          {article.article_type || 'Onbekend'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(article.created_at), 'dd MMM yyyy', { locale: nl })}
                      </div>
                    </div>
                    
                    {/* Main Title */}
                    <CardTitle className="text-xl leading-tight line-clamp-2 mb-4 font-bold">
                      {article.title}
                    </CardTitle>
                    
                    {/* Focus Keyword - Prominent */}
                    <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Search className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Hoofdkeyword</div>
                        <div className="font-bold text-primary text-lg">{article.focus_keyword}</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* View Full Content Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSidePanel(article)}
                      className="w-full h-10 border-dashed hover:border-solid hover:bg-primary/5 transition-all"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      <span className="font-medium">Volledige tekst bekijken</span>
                    </Button>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadArticle(article)}
                        className="w-full h-9 font-medium hover:bg-primary/5 hover:border-primary/20 transition-all"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveArticle(article.id)}
                        className="w-full h-9 font-medium text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-all"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
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

      {/* Side Panel for Full Content - Same as Archive */}
      {sidePanelOpen && selectedArticle && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeSidePanel}
          />
          
          {/* Side Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedArticle.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedArticle.focus_keyword} • {format(new Date(selectedArticle.created_at), 'dd MMM yyyy', { locale: nl })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeSidePanel}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Article Content */}
                {selectedArticle.content_article && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span>Artikel Content</span>
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert bg-white/50 p-6 rounded-lg border">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedArticle.content_article}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* FAQ Content */}
                {selectedArticle.content_faq && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span>FAQ Content</span>
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert bg-white/50 p-6 rounded-lg border">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedArticle.content_faq}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Metadata</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Type:</span>
                      <div className="mt-1">{selectedArticle.article_type || 'Onbekend'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Land:</span>
                      <div className="mt-1">{selectedArticle.country || 'Niet opgegeven'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Taal:</span>
                      <div className="mt-1">{selectedArticle.language || 'Niet opgegeven'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Aangemaakt:</span>
                      <div className="mt-1">{format(new Date(selectedArticle.created_at), 'dd MMM yyyy HH:mm', { locale: nl })}</div>
                    </div>
                  </div>

                  {/* Additional Keywords */}
                  {selectedArticle.additional_keywords && selectedArticle.additional_keywords.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-medium text-muted-foreground">Aanvullende zoekwoorden:</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedArticle.additional_keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Headings */}
                  {selectedArticle.additional_headings && selectedArticle.additional_headings.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-medium text-muted-foreground">Aanvullende headers:</span>
                      <div className="space-y-1">
                        {selectedArticle.additional_headings.map((heading, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            • {heading}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t bg-muted/30">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => downloadArticle(selectedArticle)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      closeSidePanel()
                      handleRemoveArticle(selectedArticle.id)
                    }}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Verwijder
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

