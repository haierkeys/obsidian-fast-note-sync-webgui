/**
 * Add a random parameter to URL to bypass CDN cache
 * @param url - The base URL
 * @returns URL with random parameter
 */
export function addCacheBuster(url: string): string {
    const separator = url.includes("?") ? "&" : "?"
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `${url}${separator}_=${timestamp}_${random}`
}
