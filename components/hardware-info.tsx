import { Card } from '@/components/ui/card'
import { Cpu, HardDrive, Monitor, Server } from 'lucide-react'
import type { SystemInfo } from '@/lib/types'

interface HardwareInfoProps {
  system: SystemInfo
}

export function HardwareInfo({ system }: HardwareInfoProps) {
  const hasAnyData = system.cpu_model || system.cpu_count || system.memory_total_gb || system.architecture || system.os

  if (!hasAnyData) {
    return null
  }

  // Format CPU string: "Intel i7-8809G @ 3.10GHz (8 cores)" or just "8 cores" if no model
  const formatCpu = () => {
    if (system.cpu_model && system.cpu_count) {
      return `${system.cpu_model} (${system.cpu_count} cores)`
    }
    if (system.cpu_model) {
      return system.cpu_model
    }
    if (system.cpu_count) {
      return `${system.cpu_count} cores`
    }
    return null
  }

  // Format memory: "32.8 GB"
  const formatMemory = () => {
    if (system.memory_total_gb) {
      return `${system.memory_total_gb.toFixed(1)} GB`
    }
    return null
  }

  // Format OS: "linux 6.8.0-86-generic" or just "linux"
  const formatOs = () => {
    if (system.os && system.os_release) {
      return `${system.os} ${system.os_release}`
    }
    if (system.os) {
      return system.os
    }
    return null
  }

  const cpuInfo = formatCpu()
  const memoryInfo = formatMemory()
  const osInfo = formatOs()

  const items = [
    { icon: Cpu, label: 'CPU', value: cpuInfo },
    { icon: HardDrive, label: 'Memory', value: memoryInfo },
    { icon: Server, label: 'Architecture', value: system.architecture },
    { icon: Monitor, label: 'OS', value: osInfo },
  ].filter(item => item.value)

  if (items.length === 0) {
    return null
  }

  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Server className="h-4 w-4 text-muted-foreground" />
        System Hardware
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2">
            <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-sm font-mono text-foreground truncate" title={value ?? undefined}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
