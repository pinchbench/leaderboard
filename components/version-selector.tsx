'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { BenchmarkVersion } from '@/lib/types'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface VersionSelectorProps {
    versions: BenchmarkVersion[]
    currentVersion: string | null
}

export function VersionSelector({ versions, currentVersion }: VersionSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleVersionChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'latest') {
            params.delete('version')
        } else {
            params.set('version', value)
        }
        const query = params.toString()
        router.push(query ? `/?${query}` : '/')
    }

    return (
        <Select value={currentVersion ?? 'latest'} onValueChange={handleVersionChange}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="latest">Latest (current)</SelectItem>
                {versions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                        {v.id} ({v.submission_count} runs)
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
