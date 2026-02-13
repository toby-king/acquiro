/**
 * Validates an email address format
 * @param email - The email address to validate
 * @returns true if the email format is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Basic email validation regex
  // Checks for: at least one character before @, @ symbol, at least one character after @, dot, at least one character after dot
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(email.trim());
}
