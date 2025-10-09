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
  const [isMounted, setIsMounted] = useState(false)

  // Handle SSR hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const fetchClients = async () => {
    // Only fetch on client-side after mount
    if (typeof window === 'undefined' || !isMounted) return
    
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
    if (isMounted) {
      fetchClients()
    }
  }, [isMounted])

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

  // Load selected client from localStorage (only once when clients are loaded)
  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted && clients.length > 0 && !selectedClient) {
      try {
        const savedClientId = localStorage.getItem('selectedClientId')
        if (savedClientId) {
          const client = clients.find(c => c.id === savedClientId)
          if (client) {
            console.log('🔄 Restoring selected client from localStorage:', client.naam)
            setSelectedClient(client)
          }
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e)
      }
    }
  }, [clients, isMounted, selectedClient])

  // Always render the same structure to prevent hook count mismatch
  const contextValue = !isMounted ? {
    selectedClient: null,
    setSelectedClient: () => {},
    clients: [],
    isLoading: true,
    refreshClients: async () => {}
  } : {
    selectedClient,
    setSelectedClient,
    clients,
    isLoading,
    refreshClients: fetchClients
  }

  return (
    <ClientContext.Provider value={contextValue}>
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

