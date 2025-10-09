"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Building2, Plus, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useClientContext } from "@/hooks/use-client-context"

export function ClientSwitcher() {
  const router = useRouter()
  const { selectedClient, setSelectedClient, clients, isLoading } = useClientContext()
  const [open, setOpen] = React.useState(false)

  // Debug logging
  React.useEffect(() => {
    console.log('🔄 ClientSwitcher render:', {
      selectedClient: selectedClient?.naam,
      clientsCount: clients.length,
      clients: clients.map(c => ({ id: c.id, naam: c.naam })),
      isLoading,
      open
    })
  }, [selectedClient, clients, isLoading, open])

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecteer een client"
          className="w-full justify-between bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 hover:from-primary/20 hover:via-primary/10 hover:to-primary/20 border-primary/20 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md group relative overflow-hidden"
          onClick={() => {
            console.log('🖱️ Button clicked, current open state:', open)
            setOpen(!open)
          }}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <div className="flex items-center gap-2 truncate relative z-10">
            <div className="relative">
              <Building2 className="h-4 w-4 shrink-0 text-primary" />
              {selectedClient && (
                <Sparkles className="h-2 w-2 absolute -top-1 -right-1 text-primary animate-pulse" />
              )}
            </div>
            <span className="truncate font-medium">
              {isLoading ? 'Laden...' : selectedClient ? selectedClient.naam : 'Selecteer client'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 border-primary/20 shadow-xl z-50" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Command>
          <CommandInput placeholder="Zoek client..." className="border-0" />
          <CommandList>
            <CommandEmpty>Geen clients gevonden.</CommandEmpty>
            <CommandGroup heading="Clients" className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.naam}
                  onSelect={(value) => {
                    console.log('🔄 Client selected:', client.naam, client.id, 'value:', value)
                    console.log('🔄 About to call setSelectedClient with:', client)
                    console.log('🔄 Current selectedClient before change:', selectedClient?.naam)
                    setSelectedClient(client)
                    console.log('🔄 setSelectedClient called, closing dialog')
                    setOpen(false)
                  }}
                  onClick={() => {
                    console.log('🖱️ Click event fired for:', client.naam, client.id)
                  }}
                  className="text-sm rounded-md my-0.5 hover:bg-primary/10 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="flex-1 truncate font-medium">{client.naam}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 text-primary",
                      selectedClient?.id === client.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false)
                  router.push('/dashboard/admin/clients')
                }}
                className="text-sm rounded-md my-0.5 hover:bg-primary/10 cursor-pointer transition-colors text-primary"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <span className="ml-2 font-medium">Nieuwe Client</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    </div>
  )
}

