'use client'

import { getActiveBanner } from '@/lib/banner-config'
import { PoweredByBanner } from './powered-by-banner'
import { ProductHuntBanner } from './product-hunt-banner'
import { XFollowBanner } from './x-follow-banner'

export function TopBanner() {
    const activeBanner = getActiveBanner()
    
    switch (activeBanner) {
        case 'x-follow':
            return <XFollowBanner />
        case 'product-hunt':
            return <ProductHuntBanner />
        case 'kiloclaw':
            return <PoweredByBanner />
        case 'none':
            return null
    }
}
