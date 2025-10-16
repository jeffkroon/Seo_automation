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
    if (typeof window === 'undefined' || !isMounted) {
      console.log('🔄 fetchClients skipped: window undefined or not mounted')
      return
    }
    
    try {
      console.log('🔄 fetchClients starting...')
      setIsLoading(true)
      const response = await apiClient('/api/admin/clients')
      console.log('🔄 fetchClients response:', response.status, response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔄 fetchClients data:', data)
        setClients(data.clients || [])
        
        // Only auto-select first client if no saved client exists
        if (!selectedClient && data.clients && data.clients.length > 0) {
          const savedClientId = typeof window !== 'undefined' ? localStorage.getItem('selectedClientId') : null
          if (!savedClientId) {
            console.log('🔄 No saved client, auto-selecting first client:', data.clients[0].naam)
            setSelectedClient(data.clients[0])
          } else {
            console.log('🔄 Saved client exists, will restore from localStorage')
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Failed to fetch clients:', response.status, errorData)
        console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()))
      }
    } catch (error) {
      console.error('❌ Error fetching clients:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    } finally {
      setIsLoading(false)
      console.log('🔄 fetchClients finished, isLoading set to false')
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
        console.log('💾 Saving selected client to localStorage:', selectedClient.naam, selectedClient.id)
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
          } else {
            console.log('🔄 Saved client not found, keeping first client as default')
          }
        } else {
          console.log('🔄 No saved client, using first client as default')
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e)
      }
    }
  }, [clients, isMounted]) // Remove selectedClient from dependencies to prevent loop

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

