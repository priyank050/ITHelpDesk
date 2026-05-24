// Cascading category data for IT Help Desk
// Structure: Main Category → Subcategory → Item/Detail[]

export interface CategoryHierarchy {
  [mainCategory: string]: {
    [subcategory: string]: string[];
  };
}

export const CATEGORY_HIERARCHY: CategoryHierarchy = {
  'Hardware': {
    'Desktop': ['Desktop not powering on', 'Desktop slow performance', 'Desktop overheating', 'Desktop hardware failure'],
    'Laptop': ['Laptop not powering on', 'Laptop battery issue', 'Laptop screen damage', 'Laptop keyboard not working'],
    'Printer': ['Printer offline', 'Paper jam', 'Print quality issue', 'Printer driver problem'],
    'Scanner': ['Scanner not detected', 'Scan quality issue', 'Scanner software error'],
    'Monitor': ['Monitor no display', 'Monitor flickering', 'Monitor color calibration'],
    'Keyboard / Mouse': ['Keyboard not working', 'Mouse not responding', 'Wireless connectivity issue'],
    'UPS': ['UPS not charging', 'UPS beeping', 'UPS replacement needed'],
    'Mobile Device': ['Mobile device sync issue', 'Mobile device damage', 'Mobile device lost/stolen'],
  },
  'Software': {
    'Microsoft Office': ['Word crashing', 'Excel formula error', 'Outlook not syncing', 'PowerPoint corruption'],
    'ERP': ['ERP login issue', 'ERP report error', 'ERP data sync problem', 'ERP module access'],
    'Antivirus': ['Antivirus update failed', 'False positive detection', 'Scan performance issue'],
    'PDF Reader': ['PDF not opening', 'PDF printing issue', 'PDF editor needed'],
    'Browser': ['Browser crashing', 'Browser slow', 'Extension conflict', 'Certificate error'],
    'Custom Application': ['App installation failed', 'App crashing', 'App feature request', 'App bug report'],
    'License Activation': ['License expired', 'License key needed', 'License transfer request'],
  },
  'Network / Internet': {
    'LAN Issue': ['No network connectivity', 'Intermittent connection', 'Network cable damage'],
    'WiFi Issue': ['Cannot connect to WiFi', 'WiFi slow speed', 'WiFi keeps disconnecting'],
    'VPN': ['VPN connection failed', 'VPN slow speed', 'VPN access request'],
    'Slow Internet': ['General slow browsing', 'Download speed issue', 'Video call quality'],
    'No Internet': ['Complete outage', 'Specific site blocked', 'DNS resolution error'],
    'Shared Folder Access': ['Cannot access folder', 'Permission denied', 'Folder mapping issue'],
  },
  'Email & Communication': {
    'Outlook': ['Outlook not opening', 'Outlook sync error', 'Outlook search not working', 'Outlook add-in issue'],
    'Email Access': ['Cannot access mailbox', 'Mailbox login error', 'Email forwarding setup'],
    'Password Reset': ['Forgot password', 'Account locked', 'Password policy issue'],
    'Mailbox Full': ['Mailbox at capacity', 'Archive mailbox request', 'Email cleanup assistance'],
    'Distribution Group': ['Create new DG', 'Modify DG members', 'DG email not received'],
    'Teams / Zoom': ['Meeting join issue', 'Audio/Video problem', 'Screen sharing not working', 'Chat sync issue'],
  },
  'User Account / Access Management': {
    'New User Creation': ['New employee account', 'Contractor account', 'Temporary access'],
    'Disable User': ['Employee offboarding', 'Contractor termination', 'Temporary suspension'],
    'Password Reset': ['User forgot password', 'Password expired', 'Multi-factor reset'],
    'Role Access': ['Role elevation request', 'Role change', 'Role removal'],
    'Permission Change': ['Add permission', 'Remove permission', 'Permission audit'],
  },
  'Security': {
    'Antivirus Alert': ['Malware detected', 'Ransomware alert', 'PUP detected'],
    'Phishing Email': ['Suspicious email received', 'Clicked phishing link', 'Report spam'],
    'Suspicious Activity': ['Unauthorized access attempt', 'Unknown login', 'Data exfiltration concern'],
    'USB Access': ['Request USB access', 'USB device not working', 'USB policy exception'],
    'Firewall Request': ['Port opening request', 'Application allowlist', 'IP whitelist'],
  },
  'Asset Management': {
    'New Asset Request': ['New laptop request', 'New desktop request', 'New peripheral request', 'New mobile device'],
    'Asset Transfer': ['Transfer to another user', 'Transfer to another department', 'Location change'],
    'Asset Return': ['Equipment return', 'Damaged asset return', 'End of lease return'],
    'Warranty Check': ['Check warranty status', 'File warranty claim', 'Extended warranty request'],
    'Stock Request': ['Consumables request', 'Spare parts request', 'Bulk order'],
  },
  'Server / Infrastructure': {
    'File Server': ['File server slow', 'File server access error', 'File restoration request'],
    'Backup': ['Backup failure', 'Restore request', 'Backup schedule change'],
    'AD Server': ['AD replication issue', 'Group Policy problem', 'AD account sync'],
    'Database': ['Database slow', 'Database connection error', 'Database backup request'],
    'CCTV': ['CCTV not recording', 'CCTV playback request', 'CCTV storage full'],
    'Attendance Machine': ['Biometric not working', 'Attendance sync error', 'New user enrollment'],
  },
  'Facilities / Misc IT Support': {
    'Projector': ['Projector not displaying', 'Projector remote lost', 'Projector lamp replacement'],
    'Meeting Room Setup': ['AV equipment setup', 'Video conference setup', 'Whiteboard/display setup'],
    'Video Conference': ['VC system not working', 'VC audio issue', 'VC camera problem'],
    'TV Display': ['Display not working', 'Content update request', 'Display mount issue'],
  },
  'Service Requests': {
    'Install Software': ['Standard software install', 'Custom software install', 'Software upgrade'],
    'New Email ID': ['New mailbox creation', 'Shared mailbox request', 'Alias creation'],
    'New Printer Setup': ['Network printer setup', 'Local printer setup', 'Printer driver install'],
    'Upgrade RAM': ['RAM upgrade request', 'SSD upgrade request', 'Hardware spec check'],
    'Shared Folder Request': ['New shared folder', 'Folder permission change', 'Folder archive'],
  },
  'Production IT': {
    'Shop Floor PC': ['PC not booting', 'PC slow', 'PC application error', 'PC replacement needed'],
    'Barcode Scanner': ['Scanner not scanning', 'Scanner pairing issue', 'Scanner battery problem'],
    'Label Printer': ['Label printer jam', 'Label print quality', 'Label template update'],
    'PLC Connectivity': ['PLC communication error', 'PLC programming request', 'PLC network issue'],
    'CNC System Support': ['CNC software error', 'CNC network connection', 'CNC backup request'],
  },
  'Plant Operations': {
    'CCTV': ['Camera offline', 'Recording playback', 'New camera installation'],
    'Biometric Machine': ['Fingerprint not recognized', 'Machine offline', 'Attendance data sync'],
    'Warehouse Terminal': ['Terminal not responding', 'Terminal software issue', 'Terminal replacement'],
  },
};

export const MAIN_CATEGORIES = Object.keys(CATEGORY_HIERARCHY);

export function getSubcategories(mainCategory: string): string[] {
  const category = CATEGORY_HIERARCHY[mainCategory];
  return category ? Object.keys(category) : [];
}

export function getItemDetails(mainCategory: string, subcategory: string): string[] {
  const category = CATEGORY_HIERARCHY[mainCategory];
  if (!category) return [];
  return category[subcategory] || [];
}

export const CATEGORY_ICONS: Record<string, string> = {
  'Hardware': '🖥️',
  'Software': '💾',
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

// Company prefix mapping for ticket IDs
export const COMPANY_PREFIXES: Record<string, string> = {
  'Rex-Tone Industries Ltd': 'RIL',
  'Globex Laboratories R & D Ltd': 'GLL',
};

// Generate unique Ticket ID with company prefix (format: PREFIX-YYYYMMDD-HHMMSS)
// Example: RIL-20260520-143052, GLL-20260520-093215
// Time-based format ensures uniqueness: Hour (HH) + Minute (MM) + Second (SS)
export function generateTicketId(company?: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const dateKey = `${year}${month}${day}`;
  const timeKey = `${hours}${minutes}${seconds}`;
  
  // Get company prefix or default to 'TKT'
  const prefix = company && COMPANY_PREFIXES[company] ? COMPANY_PREFIXES[company] : 'TKT';
  
  return `${prefix}-${dateKey}-${timeKey}`;
}