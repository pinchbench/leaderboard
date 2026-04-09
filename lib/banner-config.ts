/**
 * Banner configuration
 * 
 * Only one banner shows at a time.
 * Options: 'x-follow' | 'product-hunt' | 'kiloclaw' | 'none'
 * 
 * Banners show in priority order with end dates:
 * 1. X follow banner (one week, then switches to KiloClaw)
 * 2. Product Hunt banner (until end date, then switches to KiloClaw)
 * 3. KiloClaw banner (default)
 */

// X follow banner end date (UTC) - one week from 2026-04-09
const X_FOLLOW_END_DATE = new Date('2026-04-16T00:00:00Z')

// Product Hunt banner end date (UTC) - switches back to KiloClaw after this
const PRODUCT_HUNT_END_DATE = new Date('2026-03-31T00:00:00Z')

export function getActiveBanner(): 'x-follow' | 'product-hunt' | 'kiloclaw' | 'none' {
    const now = new Date()
    
    // Priority 1: X follow banner (one week from April 9)
    if (now < X_FOLLOW_END_DATE) {
        return 'x-follow'
    }
    
    // Priority 2: Product Hunt banner until end date, then switch to KiloClaw
    if (now < PRODUCT_HUNT_END_DATE) {
        return 'product-hunt'
    }
    
    // Default: KiloClaw banner
    return 'kiloclaw'
}

// For backwards compatibility with any direct imports
export const ACTIVE_BANNER = getActiveBanner()
