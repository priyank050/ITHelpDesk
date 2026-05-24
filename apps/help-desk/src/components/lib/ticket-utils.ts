import type { Ticket, TicketPriorityKey, TicketStatusKey } from './generated/models/ticket-model';

export const PRIORITY_CONFIG: Record<TicketPriorityKey, { label: string; className: string; badgeClass: string; slaHours: number }> = {
  PriorityKey0: { 
    label: 'Low', 
    className: 'text-green-700 dark:text-green-400',
    badgeClass: 'bg-secondary text-secondary-foreground',
    slaHours: 48
  },
  PriorityKey1: { 
    label: 'Medium', 
    className: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-accent text-accent-foreground',
    slaHours: 24
  },
  PriorityKey2: { 
    label: 'High', 
    className: 'text-orange-600 dark:text-orange-400',
    badgeClass: 'bg-primary text-primary-foreground',
    slaHours: 8
  },
  PriorityKey3: { 
    label: 'Critical', 
    className: 'text-red-600 dark:text-red-400',
    badgeClass: 'bg-destructive text-destructive-foreground',
    slaHours: 4
  },
};

export const STATUS_CONFIG: Record<TicketStatusKey, { label: string; className: string; badgeClass: string }> = {
  StatusKey0: { 
    label: 'Open', 
    className: 'text-blue-600 dark:text-blue-400',
    badgeClass: 'bg-primary text-primary-foreground'
  },
  StatusKey1: { 
    label: 'In Progress', 
    className: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-accent text-accent-foreground'
  },
  StatusKey2: { 
    label: 'Resolved', 
    className: 'text-green-600 dark:text-green-400',
    badgeClass: 'bg-secondary text-secondary-foreground'
  },
  StatusKey3: { 
    label: 'Closed', 
    className: 'text-gray-600 dark:text-gray-400',
    badgeClass: 'bg-muted text-muted-foreground'
  },
};

export function isTicketOverdue(ticket: Ticket): boolean {
  if (!ticket.sLADueDate) return false;
  const dueDate = new Date(ticket.sLADueDate);
  const now = new Date();
  return dueDate < now && ticket.statusKey !== 'StatusKey2' && ticket.statusKey !== 'StatusKey3';
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

/**
 * Company prefixes for ticket numbers
 */
export const COMPANY_PREFIXES: Record<string, string> = {
  'Rex-Tone Industries Ltd': 'RIL',
  'Globex Laboratories R & D Ltd': 'GLL',
};

/**
 * Generate ticket number in format PREFIX-YYYYMMDD-hhmmss
 * @param company The company name (determines the prefix)
 * @returns Ticket number like RIL-20260522-143052 or GLL-20260522-143052
 */
export function generateTicketNumber(company: string): string {
  const prefix = COMPANY_PREFIXES[company] || 'TKT';
  const now = new Date();
  
  // Format date: YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Format time: hhmmss (unique identifier based on time)
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}${minutes}${seconds}`;
  
  return `${prefix}-${dateStr}-${timeStr}`;
}

/**
 * @deprecated Use generateTicketNumber instead
 */
export function generateTicketId(): string {
  const num = Math.floor(Math.random() * 90000) + 10000;
  return `TKT-${num}`;
}

export const CATEGORY_ICONS: Record<string, string> = {
  'Hardware': '💻',
  'Software': '🖥️',
  'Network / Internet': '🌐',
  'Email & Communication': '📧',
  'User Account / Access Management': '👤',
  'Security': '🔒',
  'Asset Management': '📦',
  'Server / Infrastructure': '🖧',
  'Facilities / Misc IT Support': '🏢',
  'Service Requests': '📋',
  'Production IT': '🏭',
  'Plant Operations': '⚙️',
};
