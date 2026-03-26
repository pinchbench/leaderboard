import { ACTIVE_BANNER } from '@/lib/banner-config'
import { PoweredByBanner } from './powered-by-banner'
import { ProductHuntBanner } from './product-hunt-banner'

export function TopBanner() {
    switch (ACTIVE_BANNER) {
        case 'product-hunt':
            return <ProductHuntBanner />
        case 'kiloclaw':
            return <PoweredByBanner />
        case 'none':
            return null
    }
}
