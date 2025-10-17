"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Activity, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

interface WorkflowLog {
  id: string
  workflow_type: string
  status: string
  schedule_ids: string[]
  message: string
  error?: string
  stats?: {
    found: number
    processed: number
    failed: number
  }
  created_at: string
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-600" />
    case 'processing':
      return <Activity className="h-4 w-4 text-blue-600" />
    case 'started':
      return <Clock className="h-4 w-4 text-yellow-600" />
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-600" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return "bg-green-100 text-green-800"
    case 'error':
      return "bg-red-100 text-red-800"
    case 'processing':
      return "bg-blue-100 text-blue-800"
    case 'started':
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function WorkflowMonitor() {
  const [logs, setLogs] = useState<WorkflowLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchWorkflowLogs = async () => {
    setIsLoading(true)
    try {
      // This would be a new API endpoint to fetch workflow logs
      const response = await apiClient.get('/api/workflow-logs')
      setLogs(response.data || [])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch workflow logs:', error)
      toast({
        title: "Error",
        description: "Failed to fetch workflow logs",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkflowLogs()
    
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchWorkflowLogs, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('nl-NL', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getWorkflowTypeLabel = (type: string) => {
    switch (type) {
      case 'schedule_processor':
        return 'Schedule Processor'
      case 'schedule_execution':
        return 'Schedule Execution'
      case 'schedule_completion':
        return 'Schedule Completion'
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Workflow Monitor
            </CardTitle>
            <CardDescription>
              Real-time monitoring of n8n workflow execution
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-gray-500">
                Last update: {formatTime(lastUpdate.toISOString())}
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchWorkflowLogs}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No workflow logs found</p>
            <p className="text-sm">Workflow activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <span className="font-medium text-sm">
                      {getWorkflowTypeLabel(log.workflow_type)}
                    </span>
                    <Badge className={getStatusColor(log.status)}>
                      {log.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTime(log.created_at)}
                  </span>
                </div>
                
                {log.message && (
                  <p className="text-sm text-gray-700 mb-2">{log.message}</p>
                )}
                
                {log.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                    <p className="text-sm text-red-800">{log.error}</p>
                  </div>
                )}
                
                {log.stats && (
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>Found: {log.stats.found}</span>
                    <span>Processed: {log.stats.processed}</span>
                    <span>Failed: {log.stats.failed}</span>
                  </div>
                )}
                
                {log.schedule_ids.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      Schedule IDs: {log.schedule_ids.slice(0, 3).join(', ')}
                      {log.schedule_ids.length > 3 && ` (+${log.schedule_ids.length - 3} more)`}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
