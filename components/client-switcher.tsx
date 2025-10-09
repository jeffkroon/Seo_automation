"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Building2, Plus } from "lucide-react"
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecteer een client"
          className="w-full justify-between bg-sidebar-accent/50 hover:bg-sidebar-accent border-sidebar-border"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {isLoading ? 'Laden...' : selectedClient ? selectedClient.naam : 'Selecteer client'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Zoek client..." />
          <CommandList>
            <CommandEmpty>Geen clients gevonden.</CommandEmpty>
            <CommandGroup heading="Clients">
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  onSelect={() => {
                    setSelectedClient(client)
                    setOpen(false)
                  }}
                  className="text-sm"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">{client.naam}</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
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
                className="text-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe Client
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

