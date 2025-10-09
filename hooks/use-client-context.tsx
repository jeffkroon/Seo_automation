"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

interface Client {
  id: string
  naam: string
  website_url: string | null
  notities: string | null
}

interface ClientContextType {
  selectedClient: Client | null
  setSelectedClient: (client: Client | null) => void
  clients: Client[]
  isLoading: boolean
  refreshClients: () => Promise<void>
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchClients = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient('/api/admin/clients')
      
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
        
        // Auto-select first client if none selected
        if (!selectedClient && data.clients && data.clients.length > 0) {
          setSelectedClient(data.clients[0])
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Save selected client to localStorage
  useEffect(() => {
    if (selectedClient) {
      localStorage.setItem('selectedClientId', selectedClient.id)
    }
  }, [selectedClient])

  // Load selected client from localStorage
  useEffect(() => {
    const savedClientId = localStorage.getItem('selectedClientId')
    if (savedClientId && clients.length > 0) {
      const client = clients.find(c => c.id === savedClientId)
      if (client) {
        setSelectedClient(client)
      }
    }
  }, [clients])

  return (
    <ClientContext.Provider value={{
      selectedClient,
      setSelectedClient,
      clients,
      isLoading,
      refreshClients: fetchClients
    }}>
      {children}
    </ClientContext.Provider>
  )
}

export function useClientContext() {
  const context = useContext(ClientContext)
  if (context === undefined) {
    throw new Error('useClientContext must be used within a ClientProvider')
  }
  return context
}

