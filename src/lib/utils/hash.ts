/**
 * Java-style string hashCode implementation
 * Returns a signed 32-bit integer as a string
 */
export function hashCode(str: string): string {
    let hash = 0;
    if (str.length === 0) return "0";
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}
