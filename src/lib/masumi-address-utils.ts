/**
 * Masumi Address Utilities
 * The paymentIdentifier from Masumi is already a valid Cardano address
 */

/**
 * Check if an address is valid
 */
export function isValidAddress(address: string): boolean {
  // Basic validation
  if (!address) return false;
  
  // Check prefix
  const validPrefixes = ['addr1', 'addr_test1'];
  return validPrefixes.some(prefix => address.startsWith(prefix));
}

/**
 * Get network from address
 */
export function getNetworkFromAddress(address: string): 'mainnet' | 'testnet' | 'unknown' {
  if (address.startsWith('addr1')) return 'mainnet';
  if (address.startsWith('addr_test1')) return 'testnet';
  return 'unknown';
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 20) return address;
  return `${address.slice(0, 12)}...${address.slice(-8)}`;
} 