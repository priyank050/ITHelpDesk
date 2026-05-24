import type { Ticket, Company, Department } from './generated/models';

// Excel-like CSV format with headers
export interface ImportData {
  tickets?: TicketImportRow[];
  companies?: CompanyImportRow[];
  departments?: DepartmentImportRow[];
}

export interface TicketImportRow {
  ticket_id: string;
  title: string;
  description: string;
  main_category: string;
  subcategory: string;
  item_detail: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  company_name: string;
  department_name?: string;
  raised_by_name?: string;
  requester_email?: string;
  mobile_number?: string;
  assigned_to?: string;
  sla_due_date?: string;
  created_by: string;
  created_date: string;
}

export interface CompanyImportRow {
  name: string;
  ticket_prefix: string;
  industry?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: 'Yes' | 'No';
}

export interface DepartmentImportRow {
  name: string;
  description?: string;
  company_name: string;
  manager_name?: string;
  is_active: 'Yes' | 'No';
}

// Sample data templates
export const getSampleTicketsCSV = (): string => {
  const headers = [
    'ticket_id',
    'title',
    'description',
    'main_category',
    'subcategory',
    'item_detail',
    'priority',
    'status',
    'company_name',
    'department_name',
    'raised_by_name',
    'requester_email',
    'mobile_number',
    'assigned_to',
    'sla_due_date',
    'created_by',
    'created_date'
  ];
  
  const sampleRows = [
    [
      'RIL-20260523-100000',
      'Network connectivity issue',
      'Unable to connect to internal network resources',
      'Network',
      'Connectivity',
      'LAN Issues',
      'High',
      'Open',
      'Rex-Tone Industries Ltd',
      'IT Support',
      'John Doe',
      'john.doe@rextone.com',
      '+1234567890',
      'Sarah Martinez',
      '2026-05-25',
      'admin@system.com',
      '2026-05-23'
    ],
    [
      'GLL-20260523-100100',
      'Software installation request',
      'Need to install Visual Studio Code for development',
      'Software',
      'Installation',
      'Development Tools',
      'Medium',
      'In Progress',
      'Globex Laboratories R & D Ltd',
      'R&D',
      'Jane Smith',
      'jane.smith@globex.com',
      '+0987654321',
      'James Wilson',
      '2026-05-26',
      'admin@system.com',
      '2026-05-23'
    ]
  ];
  
  return [headers.join(','), ...sampleRows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))].join('\n');
};

export const getSampleCompaniesCSV = (): string => {
  const headers = [
    'name',
    'ticket_prefix',
    'industry',
    'address',
    'contact_email',
    'contact_phone',
    'is_active'
  ];
  
  const sampleRows = [
    ['Rex-Tone Industries Ltd', 'RIL', 'Manufacturing', '123 Industrial Way, City, State 12345', 'contact@rextone.com', '+1-555-0100', 'Yes'],
    ['Globex Laboratories R & D Ltd', 'GLL', 'Research & Development', '456 Science Park, Innovation City 67890', 'info@globex.com', '+1-555-0200', 'Yes']
  ];
  
  return [headers.join(','), ...sampleRows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))].join('\n');
};

export const getSampleDepartmentsCSV = (): string => {
  const headers = [
    'name',
    'description',
    'company_name',
    'manager_name',
    'is_active'
  ];
  
  const sampleRows = [
    ['IT Support', 'Handles all IT-related support tickets', 'Rex-Tone Industries Ltd', 'Sarah Martinez', 'Yes'],
    ['HR', 'Human Resources department', 'Rex-Tone Industries Ltd', 'Mike Johnson', 'Yes'],
    ['Finance', 'Financial operations and accounting', 'Rex-Tone Industries Ltd', 'Lisa Chen', 'Yes'],
    ['R&D', 'Research and Development team', 'Globex Laboratories R & D Ltd', 'Dr. Robert Brown', 'Yes'],
    ['Quality Assurance', 'Product quality testing', 'Globex Laboratories R & D Ltd', 'Emily Davis', 'Yes']
  ];
  
  return [headers.join(','), ...sampleRows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))].join('\n');
};

// Parse CSV content
export const parseCSV = (content: string): string[][] => {
  const lines = content.split('\n').filter((line: string) => line.trim());
  return lines.map((line: string) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
};

// Convert tickets to CSV for export
export const exportTicketsToCSV = (tickets: Ticket[]): string => {
  const headers = [
    'ticket_id',
    'title',
    'description',
    'main_category',
    'subcategory',
    'item_detail',
    'priority',
    'status',
    'company_name',
    'department_name',
    'raised_by_name',
    'requester_email',
    'mobile_number',
    'assigned_to',
    'sla_due_date',
    'created_by',
    'created_date'
  ];
  
  const priorityMap: Record<string, string> = {
    'PriorityKey0': 'Low',
    'PriorityKey1': 'Medium',
    'PriorityKey2': 'High',
    'PriorityKey3': 'Critical'
  };
  
  const statusMap: Record<string, string> = {
    'StatusKey0': 'Open',
    'StatusKey1': 'In Progress',
    'StatusKey2': 'Resolved',
    'StatusKey3': 'Closed'
  };
  
  const rows = tickets.map((ticket: Ticket) => [
    ticket.ticketNumber,
    ticket.title,
    ticket.description,
    ticket.mainCategory,
    ticket.subcategory,
    ticket.itemDetail,
    priorityMap[ticket.priorityKey] || ticket.priorityKey,
    statusMap[ticket.statusKey] || ticket.statusKey,
    ticket.company?.name1 || '',
    ticket.department?.name1 || '',
    ticket.raisedByName || '',
    ticket.requesterEmail || '',
    ticket.mobileNumber || '',
    ticket.assignedTo || '',
    ticket.sLADueDate || '',
    ticket.createdBy,
    ticket.createdDate
  ]);
  
  return [headers.join(','), ...rows.map((row: string[]) => row.map((cell: string) => `"${cell || ''}"`).join(','))].join('\n');
};

export const exportCompaniesToCSV = (companies: Company[]): string => {
  const headers = [
    'name',
    'ticket_prefix',
    'industry',
    'address',
    'contact_email',
    'contact_phone',
    'is_active'
  ];
  
  const rows = companies.map((company: Company) => [
    company.name1,
    company.ticketPrefix,
    company.industry || '',
    company.address || '',
    company.contactEmail || '',
    company.contactPhone || '',
    company.isActive ? 'Yes' : 'No'
  ]);
  
  return [headers.join(','), ...rows.map((row: string[]) => row.map((cell: string) => `"${cell || ''}"`).join(','))].join('\n');
};

export const exportDepartmentsToCSV = (departments: Department[]): string => {
  const headers = [
    'name',
    'description',
    'company_name',
    'manager_name',
    'is_active'
  ];
  
  const rows = departments.map((dept: Department) => [
    dept.name1,
    dept.description || '',
    dept.company?.name1 || '',
    dept.managerName || '',
    dept.isActive ? 'Yes' : 'No'
  ]);
  
  return [headers.join(','), ...rows.map((row: string[]) => row.map((cell: string) => `"${cell || ''}"`).join(','))].join('\n');
};

// Download helper
export const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Validation helpers
export const validateTicketImport = (rows: string[][], headers: string[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredHeaders = ['ticket_id', 'title', 'description', 'main_category', 'priority', 'status', 'company_name', 'created_by', 'created_date'];
  
  // Check required headers
  const missingHeaders = requiredHeaders.filter((h: string) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
  }
  
  // Validate each row
  const headerIndexMap: Record<string, number> = {};
  headers.forEach((h: string, i: number) => { headerIndexMap[h] = i; });
  
  rows.forEach((row: string[], rowIndex: number) => {
    requiredHeaders.forEach((header: string) => {
      const idx = headerIndexMap[header];
      if (idx !== undefined && (!row[idx] || row[idx].trim() === '')) {
        errors.push(`Row ${rowIndex + 2}: Missing value for "${header}"`);
      }
    });
    
    // Validate priority values
    const priorityIdx = headerIndexMap['priority'];
    if (priorityIdx !== undefined && row[priorityIdx]) {
      const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
      if (!validPriorities.includes(row[priorityIdx])) {
        errors.push(`Row ${rowIndex + 2}: Invalid priority "${row[priorityIdx]}". Must be one of: ${validPriorities.join(', ')}`);
      }
    }
    
    // Validate status values
    const statusIdx = headerIndexMap['status'];
    if (statusIdx !== undefined && row[statusIdx]) {
      const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
      if (!validStatuses.includes(row[statusIdx])) {
        errors.push(`Row ${rowIndex + 2}: Invalid status "${row[statusIdx]}". Must be one of: ${validStatuses.join(', ')}`);
      }
    }
  });
  
  return { valid: errors.length === 0, errors: errors.slice(0, 10) }; // Limit to first 10 errors
};

export const validateCompanyImport = (rows: string[][], headers: string[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredHeaders = ['name', 'ticket_prefix', 'is_active'];
  
  const missingHeaders = requiredHeaders.filter((h: string) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
  }
  
  const headerIndexMap: Record<string, number> = {};
  headers.forEach((h: string, i: number) => { headerIndexMap[h] = i; });
  
  rows.forEach((row: string[], rowIndex: number) => {
    const nameIdx = headerIndexMap['name'];
    const prefixIdx = headerIndexMap['ticket_prefix'];
    
    if (nameIdx !== undefined && (!row[nameIdx] || row[nameIdx].trim() === '')) {
      errors.push(`Row ${rowIndex + 2}: Missing company name`);
    }
    
    if (prefixIdx !== undefined && (!row[prefixIdx] || row[prefixIdx].trim() === '')) {
      errors.push(`Row ${rowIndex + 2}: Missing ticket prefix`);
    } else if (prefixIdx !== undefined && row[prefixIdx] && !/^[A-Z]{2,5}$/.test(row[prefixIdx])) {
      errors.push(`Row ${rowIndex + 2}: Invalid ticket prefix "${row[prefixIdx]}". Must be 2-5 uppercase letters`);
    }
  });
  
  return { valid: errors.length === 0, errors: errors.slice(0, 10) };
};

export const validateDepartmentImport = (rows: string[][], headers: string[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredHeaders = ['name', 'company_name', 'is_active'];
  
  const missingHeaders = requiredHeaders.filter((h: string) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
  }
  
  const headerIndexMap: Record<string, number> = {};
  headers.forEach((h: string, i: number) => { headerIndexMap[h] = i; });
  
  rows.forEach((row: string[], rowIndex: number) => {
    const nameIdx = headerIndexMap['name'];
    const companyIdx = headerIndexMap['company_name'];
    
    if (nameIdx !== undefined && (!row[nameIdx] || row[nameIdx].trim() === '')) {
      errors.push(`Row ${rowIndex + 2}: Missing department name`);
    }
    
    if (companyIdx !== undefined && (!row[companyIdx] || row[companyIdx].trim() === '')) {
      errors.push(`Row ${rowIndex + 2}: Missing company name`);
    }
  });
  
  return { valid: errors.length === 0, errors: errors.slice(0, 10) };
};
