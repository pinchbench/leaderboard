'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
} from '@/components/ui/popover'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { LeaderboardEntry } from '@/lib/types'

interface ModelSearchProps {
  entries: LeaderboardEntry[]
  officialOnly: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
}

export function ModelSearch({ entries, officialOnly, searchValue, onSearchChange }: ModelSearchProps) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)

  const uniqueModels = React.useMemo(() => {
    const models = new Map<string, { model: string; provider: string }>()
    entries.forEach((e) => {
      if (!models.has(e.model)) {
        models.set(e.model, { model: e.model, provider: e.provider })
      }
    })
    return Array.from(models.values())
  }, [entries])

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Anchor asChild>
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search or filter models..."
              value={searchValue}
              onChange={(e) => {
                onSearchChange?.(e.target.value)
                if (!open) setOpen(true)
              }}
              onFocus={() => {
                if (uniqueModels.length > 0) setOpen(true)
              }}
              className="w-full bg-muted/40 border border-border/80 rounded-lg pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>
        </PopoverPrimitive.Anchor>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Don't close if we're clicking the input
            if (e.target === inputRef.current) {
              e.preventDefault()
            }
          }}
        >
          <Command loop>
            <CommandList>
              <CommandEmpty>No model found.</CommandEmpty>
              <CommandGroup heading="Models">
                {uniqueModels
                  .filter(m =>
                    !searchValue ||
                    m.model.toLowerCase().includes(searchValue.toLowerCase()) ||
                    m.provider.toLowerCase().includes(searchValue.toLowerCase())
                  )
                  .map((m) => (
                    <CommandItem
                      key={m.model}
                      value={m.model}
                      onSelect={() => {
                        router.push(`/model/${m.provider.toLowerCase()}/${m.model}${officialOnly ? '' : '?official=false'}`)
                        setOpen(false)
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-sm">{m.model}</span>
                        <span className="text-xs text-muted-foreground">{m.provider}</span>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
