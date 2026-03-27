/**
 * Banner configuration
 * 
 * Only one banner shows at a time.
 * Options: 'product-hunt' | 'kiloclaw' | 'none'
 * 
 * Product Hunt banner shows until the specified end date, then
 * automatically switches back to the KiloClaw banner.
 */

// Product Hunt banner end date (UTC) - switches back to KiloClaw after this
const PRODUCT_HUNT_END_DATE = new Date('2026-03-31T00:00:00Z')

export function getActiveBanner(): 'product-hunt' | 'kiloclaw' | 'none' {
    const now = new Date()
    
    // Show Product Hunt banner until end date, then switch to KiloClaw
    if (now < PRODUCT_HUNT_END_DATE) {
        return 'product-hunt'
    }
    
    return 'kiloclaw'
}

// For backwards compatibility with any direct imports
export const ACTIVE_BANNER = getActiveBanner()
