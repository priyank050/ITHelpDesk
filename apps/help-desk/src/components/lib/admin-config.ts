/**
 * ========================================
 * COMPANY CONFIGURATION
 * ========================================
 */

/**
 * COMPANY NAMES & LOGOS
 * Sister companies using this IT Help Desk
 */
export const COMPANIES = {
  primary: {
    name: 'Rex-Tone Industries Ltd',
    shortName: 'A.T. Inks',
    initials: 'ATI',
    logo: 'https://i.ibb.co/XfJSd6mJ/A-T-Inks-logo.png',
    colors: { from: '#1e40af', to: '#3b82f6' },
  },
  secondary: {
    name: 'Globex Laboratories R & D Ltd',
    shortName: 'A.T. Pigments',
    initials: 'ATP',
    logo: 'https://i.ibb.co/zWgnD5Qd/AT-Pigments-Logo.png',
    colors: { from: '#7c3aed', to: '#a855f7' },
  },
  groupName: 'Rex-Tone Group',
} as const;

/**
 * ========================================
 * ADMIN CONFIGURATION
 * ========================================
 * 
 * Edit this file to configure admin users, IT staff, and roles.
 * 
 * HOW TO UPDATE:
 * 1. Add/remove email addresses in the arrays below
 * 2. Save the file
 * 3. The app will use the updated configuration
 * 
 * ========================================
 */

/**
 * ADMIN USERS
 * Users with full access to all features
 * Add email addresses (User Principal Names) here
 */
export const ADMIN_USERS: string[] = [
  'systems@atpigments.com',
  // Add more admin emails below:
  // 'another.admin@company.com',
];

/**
 * IT SUPPORT STAFF
 * Users who can view and manage all tickets
 * These names appear in the "Assign To" dropdown
 */
export const IT_STAFF: { name: string; email: string }[] = [
  { name: 'Sarah Martinez', email: 'sarah.martinez@atinks.com' },
  { name: 'James Wilson', email: 'james.wilson@atinks.com' },
  { name: 'Alex Chen', email: 'alex.chen@atinks.com' },
  { name: 'Maria Lopez', email: 'maria.lopez@atinks.com' },
  // Add more IT staff below:
  // { name: 'New Staff Member', email: 'new.staff@atinks.com' },
];

/**
 * IT SUPPORT EMAILS (auto-generated from IT_STAFF)
 * Used for role checking
 */
export const IT_SUPPORT_EMAILS: string[] = IT_STAFF.map((staff) => staff.email);

/**
 * IT STAFF NAMES (auto-generated from IT_STAFF)
 * Used for assignee dropdowns
 */
export const IT_STAFF_NAMES: string[] = IT_STAFF.map((staff) => staff.name);

/**
 * ROLE DEFINITIONS
 */
export type UserRole = 'admin' | 'it_support' | 'employee';

/**
 * Get user role based on email
 * @param userEmail - The user's email (UPN)
 * @returns The user's role
 */
export function getUserRole(userEmail: string | undefined): UserRole {
  if (!userEmail) return 'employee';
  
  const email = userEmail.toLowerCase();
  
  // Check if admin
  if (ADMIN_USERS.some((adminEmail) => adminEmail.toLowerCase() === email)) {
    return 'admin';
  }
  
  // Check if IT support
  if (IT_SUPPORT_EMAILS.some((supportEmail) => supportEmail.toLowerCase() === email)) {
    return 'it_support';
  }
  
  // Default to employee
  return 'employee';
}

/**
 * Check if user has admin access
 */
export function isAdmin(userEmail: string | undefined): boolean {
  return getUserRole(userEmail) === 'admin';
}

/**
 * Check if user has IT support access (includes admins)
 */
export function isITSupport(userEmail: string | undefined): boolean {
  const role = getUserRole(userEmail);
  return role === 'admin' || role === 'it_support';
}

/**
 * Check if user can view all tickets
 */
export function canViewAllTickets(userEmail: string | undefined): boolean {
  return isITSupport(userEmail);
}

/**
 * Check if user can assign tickets
 */
export function canAssignTickets(userEmail: string | undefined): boolean {
  return isITSupport(userEmail);
}

/**
 * Check if user can change ticket status
 */
export function canChangeStatus(userEmail: string | undefined): boolean {
  return isITSupport(userEmail);
}
