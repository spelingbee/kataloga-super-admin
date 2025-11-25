/**
 * Safely get array length, returns 0 if undefined or not an array
 */
export function safeLength(arr: any[] | undefined | null): number {
  return Array.isArray(arr) ? arr.length : 0
}

/**
 * Safely check if array has items
 */
export function hasItems(arr: any[] | undefined | null): boolean {
  return Array.isArray(arr) && arr.length > 0
}

/**
 * Safely get array or return empty array
 */
export function safeArray<T>(arr: T[] | undefined | null): T[] {
  return Array.isArray(arr) ? arr : []
}
