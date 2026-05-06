/**
 * Banner configuration
 * 
 * Only one banner shows at a time.
 * Options: 'release' | 'x-follow' | 'product-hunt' | 'kiloclaw' | 'none'
 * 
 * Banners show in priority order with end dates:
 * 1. Release banner (2 weeks from 2026-05-06)
 * 2. X follow banner (one week, then switches to KiloClaw)
 * 3. Product Hunt banner (until end date, then switches to KiloClaw)
 * 4. KiloClaw banner (default)
 */

// Release 2.0 banner end date (UTC) - 2 weeks from 2026-05-06
const RELEASE_BANNER_END_DATE = new Date('2026-05-20T00:00:00Z')

// X follow banner end date (UTC) - one week from 2026-04-09
const X_FOLLOW_END_DATE = new Date('2026-04-16T00:00:00Z')

// Product Hunt banner end date (UTC) - switches back to KiloClaw after this
const PRODUCT_HUNT_END_DATE = new Date('2026-03-31T00:00:00Z')

export function getActiveBanner(): 'release' | 'x-follow' | 'product-hunt' | 'kiloclaw' | 'none' {
    const now = new Date()
    
    // Priority 1: Release 2.0 banner (2 weeks from May 6)
    if (now < RELEASE_BANNER_END_DATE) {
        return 'release'
    }
    
    // Priority 2: X follow banner (one week from April 9)
    if (now < X_FOLLOW_END_DATE) {
        return 'x-follow'
    }
    
    // Priority 3: Product Hunt banner until end date, then switch to KiloClaw
    if (now < PRODUCT_HUNT_END_DATE) {
        return 'product-hunt'
    }
    
    // Default: KiloClaw banner
    return 'kiloclaw'
}

// For backwards compatibility with any direct imports
export const ACTIVE_BANNER = getActiveBanner()
