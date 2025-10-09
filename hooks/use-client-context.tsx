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
    // Only fetch on client-side
    if (typeof window === 'undefined') return
    
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
      } else {
        console.warn('Failed to fetch clients, this might be normal if user is not admin/owner')
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
    if (typeof window !== 'undefined' && selectedClient) {
      try {
        localStorage.setItem('selectedClientId', selectedClient.id)
      } catch (e) {
        console.error('Error saving to localStorage:', e)
      }
    }
  }, [selectedClient])

  // Load selected client from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && clients.length > 0) {
      try {
        const savedClientId = localStorage.getItem('selectedClientId')
        if (savedClientId) {
          const client = clients.find(c => c.id === savedClientId)
          if (client && client.id !== selectedClient?.id) {
            setSelectedClient(client)
          }
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e)
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
    // Don't throw, return default values instead for safer usage
    console.warn('useClientContext used outside of ClientProvider, returning defaults')
    return {
      selectedClient: null,
      setSelectedClient: () => {},
      clients: [],
      isLoading: false,
      refreshClients: async () => {}
    }
  }
  return context
}

