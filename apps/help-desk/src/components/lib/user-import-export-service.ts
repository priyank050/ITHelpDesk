import type { Users } from './generated/models/users-model';
import type { Role } from './generated/models/role-model';

// Permission definitions
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'tickets' | 'users' | 'settings' | 'reports';
}

export const ALL_PERMISSIONS: Permission[] = [
  // Ticket permissions
  { id: 'ticket_view', name: 'View Tickets', description: 'View all tickets in the system', category: 'tickets' },
  { id: 'ticket_view_own', name: 'View Own Tickets', description: 'View only tickets created by self', category: 'tickets' },
  { id: 'ticket_create', name: 'Create Tickets', description: 'Create new support tickets', category: 'tickets' },
  { id: 'ticket_edit', name: 'Edit Tickets', description: 'Edit ticket details and information', category: 'tickets' },
  { id: 'ticket_assign', name: 'Assign Tickets', description: 'Assign tickets to team members', category: 'tickets' },
  { id: 'ticket_delete', name: 'Delete Tickets', description: 'Delete tickets from the system', category: 'tickets' },
  { id: 'ticket_close', name: 'Close Tickets', description: 'Close and resolve tickets', category: 'tickets' },
  
  // User permissions
  { id: 'user_view', name: 'View Users', description: 'View user list and profiles', category: 'users' },
  { id: 'user_create', name: 'Create Users', description: 'Add new users to the system', category: 'users' },
  { id: 'user_edit', name: 'Edit Users', description: 'Modify user information', category: 'users' },
  { id: 'user_delete', name: 'Delete Users', description: 'Remove users from the system', category: 'users' },
  { id: 'user_roles', name: 'Manage Roles', description: 'Change user roles and permissions', category: 'users' },
  
  // Settings permissions
  { id: 'settings_view', name: 'View Settings', description: 'View system settings', category: 'settings' },
  { id: 'settings_manage', name: 'Manage Settings', description: 'Modify system configuration', category: 'settings' },
  { id: 'settings_branding', name: 'Manage Branding', description: 'Update logos and branding', category: 'settings' },
  
  // Reports permissions
  { id: 'reports_view', name: 'View Reports', description: 'Access reports and analytics', category: 'reports' },
  { id: 'reports_export', name: 'Export Reports', description: 'Export data and reports', category: 'reports' },
];

// Default permissions by role
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  'Administrator': [
    'ticket_view', 'ticket_view_own', 'ticket_create', 'ticket_edit', 'ticket_assign', 'ticket_delete', 'ticket_close',
    'user_view', 'user_create', 'user_edit', 'user_delete', 'user_roles',
    'settings_view', 'settings_manage', 'settings_branding',
    'reports_view', 'reports_export',
  ],
  'Adminstator': [ // Handle typo in data
    'ticket_view', 'ticket_view_own', 'ticket_create', 'ticket_edit', 'ticket_assign', 'ticket_delete', 'ticket_close',
    'user_view', 'user_create', 'user_edit', 'user_delete', 'user_roles',
    'settings_view', 'settings_manage', 'settings_branding',
    'reports_view', 'reports_export',
  ],
  'IT Support': [
    'ticket_view', 'ticket_view_own', 'ticket_create', 'ticket_edit', 'ticket_assign', 'ticket_close',
    'user_view',
    'reports_view',
  ],
  'User': [
    'ticket_view_own', 'ticket_create',
  ],
};

// Get permissions for a role
export function getPermissionsForRole(roleName: string): string[] {
  return DEFAULT_ROLE_PERMISSIONS[roleName] || DEFAULT_ROLE_PERMISSIONS['User'] || [];
}

// Check if a permission is granted
export function hasPermission(userPermissions: string, permissionId: string): boolean {
  if (!userPermissions) return false;
  const perms = userPermissions.split(',').map(p => p.trim());
  return perms.includes(permissionId);
}

// Get permissions string from array
export function permissionsToString(permissions: string[]): string {
  return permissions.join(',');
}

// Get permissions array from string
export function permissionsFromString(permissionsStr: string): string[] {
  if (!permissionsStr) return [];
  return permissionsStr.split(',').map(p => p.trim()).filter(p => p);
}

// User CSV export
export function exportUsersToCSV(users: Users[]): string {
  const headers = [
    'UserName',
    'EmailID',
    'Role',
    'Department',
    'Company',
    'PhoneNumber',
    'JobTitle',
    'IsActive',
    'Permissions',
    'AddedDate',
  ];

  const rows = users.map((user: Users) => [
    user.userName,
    user.emailID,
    user.role,
    user.department || '',
    user.company || '',
    user.phoneNumber || '',
    user.jobTitle || '',
    user.isActive ? 'Yes' : 'No',
    user.permissions || '',
    user.addedDate ? new Date(user.addedDate).toISOString().split('T')[0] : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row: string[]) => row.map((cell: string) => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

// Sample users CSV template
export function getSampleUsersCSV(): string {
  const headers = [
    'UserName',
    'EmailID',
    'Role',
    'Department',
    'Company',
    'PhoneNumber',
    'JobTitle',
    'IsActive',
    'Permissions',
  ];

  const sampleRows = [
    ['John Doe', 'john.doe@company.com', 'IT Support', 'Information Technology', 'AT Inks Ltd', '+91 98765 43210', 'IT Specialist', 'Yes', 'ticket_view,ticket_edit,ticket_assign'],
    ['Jane Smith', 'jane.smith@company.com', 'User', 'Human Resources', 'AT Pigments Ltd', '+91 98765 43211', 'HR Manager', 'Yes', 'ticket_view_own,ticket_create'],
  ];

  const csvContent = [
    headers.join(','),
    ...sampleRows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

// Validate user import
export function validateUserImport(
  rows: string[][],
  headers: string[],
  existingRoles: Role[]
): { valid: boolean; errors: string[]; validRows: ParsedUserRow[] } {
  const errors: string[] = [];
  const validRows: ParsedUserRow[] = [];
  
  const requiredHeaders = ['UserName', 'EmailID', 'Role'];
  const headerMap: Record<string, number> = {};
  
  headers.forEach((h: string, i: number) => {
    headerMap[h.trim()] = i;
  });
  
  // Check required headers
  for (const required of requiredHeaders) {
    if (!(required in headerMap)) {
      errors.push(`Missing required column: ${required}`);
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors, validRows: [] };
  }
  
  const validRoleNames = existingRoles.map((r: Role) => r.role.toLowerCase());
  const seenEmails = new Set<string>();
  
  rows.forEach((row: string[], rowIndex: number) => {
    const rowNum = rowIndex + 2; // +2 for header and 1-based index
    
    const userName = row[headerMap['UserName']]?.trim() || '';
    const emailID = row[headerMap['EmailID']]?.trim() || '';
    const role = row[headerMap['Role']]?.trim() || '';
    const department = row[headerMap['Department']]?.trim() || '';
    const company = row[headerMap['Company']]?.trim() || '';
    const phoneNumber = row[headerMap['PhoneNumber']]?.trim() || '';
    const jobTitle = row[headerMap['JobTitle']]?.trim() || '';
    const isActiveStr = row[headerMap['IsActive']]?.trim() || 'Yes';
    const permissions = row[headerMap['Permissions']]?.trim() || '';
    
    // Validate required fields
    if (!userName) {
      errors.push(`Row ${rowNum}: UserName is required`);
      return;
    }
    
    if (!emailID) {
      errors.push(`Row ${rowNum}: EmailID is required`);
      return;
    }
    
    if (!emailID.includes('@')) {
      errors.push(`Row ${rowNum}: Invalid email format`);
      return;
    }
    
    if (seenEmails.has(emailID.toLowerCase())) {
      errors.push(`Row ${rowNum}: Duplicate email ${emailID}`);
      return;
    }
    seenEmails.add(emailID.toLowerCase());
    
    if (!role) {
      errors.push(`Row ${rowNum}: Role is required`);
      return;
    }
    
    if (!validRoleNames.includes(role.toLowerCase())) {
      errors.push(`Row ${rowNum}: Invalid role "${role}". Valid roles: ${existingRoles.map((r: Role) => r.role).join(', ')}`);
      return;
    }
    
    const isActive = ['yes', 'true', '1'].includes(isActiveStr.toLowerCase());
    
    validRows.push({
      userName,
      emailID,
      role,
      department,
      company,
      phoneNumber,
      jobTitle,
      isActive,
      permissions,
    });
  });
  
  return {
    valid: errors.length === 0,
    errors,
    validRows,
  };
}

export interface ParsedUserRow {
  userName: string;
  emailID: string;
  role: string;
  department: string;
  company: string;
  phoneNumber: string;
  jobTitle: string;
  isActive: boolean;
  permissions: string;
}

// Parse CSV content
export function parseCSVContent(content: string): string[][] {
  const lines = content.split('\n').filter((line: string) => line.trim());
  return lines.map((line: string) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    
    return cells;
  });
}

// Download CSV helper
export function downloadUserCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
