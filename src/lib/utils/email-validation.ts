const ALLOWED_EMAIL_DOMAIN = "@whitman.edu"

export function isValidWhitmanEmail(email: string): boolean {
  return email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN.toLowerCase())
}

export function validateEmailDomain(email: string): {
  valid: boolean
  error?: string
} {
  if (!email) {
    return { valid: false, error: "Email is required" }
  }

  if (!isValidWhitmanEmail(email)) {
    return {
      valid: false,
      error: `Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`,
    }
  }

  return { valid: true }
}
