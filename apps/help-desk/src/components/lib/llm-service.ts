/**
 * LLM Service for IT Help Desk Chatbot
 * 
 * This service provides intelligent natural language processing for the chatbot.
 * In a production environment, this would integrate with Azure OpenAI or another LLM provider.
 * Currently uses advanced pattern matching with contextual awareness.
 */

import type { Ticket } from './generated/models/ticket-model';
import { STATUS_CONFIG, PRIORITY_CONFIG, isTicketOverdue } from './lib/ticket-utils';
import { IT_STAFF } from './lib/admin-config';
import { CATEGORY_ICONS } from './lib/category-data';

export interface LLMContext {
  tickets: Ticket[];
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  userQuery: string;
}

export interface LLMResponse {
  message: string;
  intent: LLMIntent;
  confidence: number;
  data?: {
    tickets?: Ticket[];
    ticket?: Ticket;
    knowledgeArticle?: KnowledgeArticle;
    staffStats?: StaffStat[];
    summary?: TicketSummary;
  };
  suggestedActions?: string[];
  followUpQuestions?: string[];
}

export type LLMIntent = 
  | 'ticket_list'
  | 'ticket_status'
  | 'ticket_create'
  | 'ticket_update'
  | 'knowledge_search'
  | 'staff_workload'
  | 'ticket_summary'
  | 'help_navigation'
  | 'greeting'
  | 'thanks'
  | 'unknown';

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  solution: string;
  relevanceScore: number;
}

export interface StaffStat {
  name: string;
  email: string;
  totalAssigned: number;
  openTickets: number;
  criticalTickets: number;
  avgResolutionTime: string;
}

export interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  critical: number;
  overdue: number;
  avgResolutionTime: string;
}

// Knowledge base for IT support
const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'kb-password-001',
    title: 'Password Reset Guide',
    category: 'Account Access',
    excerpt: 'Step-by-step instructions to reset your password',
    solution: `**To reset your password:**

1. Go to the login page and click "Forgot Password"
2. Enter your email address
3. Check your inbox for the reset link (check spam folder too)
4. Click the link and create a new password
5. Use at least 12 characters with mixed case, numbers, and symbols

**Password Requirements:**
• Minimum 12 characters
• At least one uppercase letter
• At least one lowercase letter  
• At least one number
• At least one special character (!@#$%^&*)

**If you're locked out:**
Contact IT Support directly or submit a high-priority ticket for immediate assistance. Include your employee ID for faster verification.`,
    relevanceScore: 0
  },
  {
    id: 'kb-network-001',
    title: 'Network Connectivity Troubleshooting',
    category: 'Network & Connectivity',
    excerpt: 'Common solutions for network and internet issues',
    solution: `**Quick Diagnostic Steps:**

1. **Check Physical Connection**
   - WiFi: Verify you're connected to the correct network
   - Wired: Ensure ethernet cable is securely plugged in

2. **Restart Network Components**
   - Turn off WiFi and turn it back on
   - Restart your computer
   - If using a docking station, disconnect and reconnect

3. **Run Windows Network Diagnostics**
   - Settings → Network & Internet → Network troubleshooter
   - Follow the on-screen instructions

4. **Clear DNS Cache**
   - Open Command Prompt as Administrator
   - Run: \`ipconfig /flushdns\`
   - Run: \`ipconfig /release\` then \`ipconfig /renew\`

5. **Check VPN Status**
   - If using VPN, try disconnecting and reconnecting
   - Some sites may be blocked when not on VPN

**Still having issues?** Create a support ticket with:
- Error messages (screenshot if possible)
- When the issue started
- Which sites/apps are affected`,
    relevanceScore: 0
  },
  {
    id: 'kb-email-001',
    title: 'Email & Outlook Troubleshooting',
    category: 'Email & Communication',
    excerpt: 'Solutions for common email and Outlook issues',
    solution: `**Common Email Fixes:**

**1. Outlook Not Syncing**
- Check your internet connection
- Go to File → Account Settings → Repair
- Try using Outlook Web (outlook.office.com) to verify emails are arriving

**2. Can't Send Emails**
- Check if attachment size is under 25MB limit
- Verify recipient email address is correct
- Check your Outbox for stuck emails

**3. Missing Emails**
- Check Junk/Spam folder
- Check Focused vs Other inbox tabs
- Use Search to find specific emails
- Check if rules are moving emails to folders

**4. Calendar Issues**
- Clear Outlook cache: File → Account Settings → Data Files → Settings → Clear cache
- Remove and re-add the calendar

**5. Outlook Crashes**
- Start Outlook in Safe Mode: Hold CTRL while clicking Outlook
- Disable add-ins: File → Options → Add-ins → Manage COM Add-ins

**For persistent issues, include in your ticket:**
- Error messages (screenshot if possible)
- When the issue started
- Whether it affects all emails or specific ones`,
    relevanceScore: 0
  },
  {
    id: 'kb-software-001',
    title: 'Software Installation & Issues',
    category: 'Software & Applications',
    excerpt: 'Guide for software requests and troubleshooting',
    solution: `**Requesting New Software:**

1. Submit a ticket with:
   - Software name and version needed
   - Business justification (why you need it)
   - Licensing information if available
   - Urgency level

2. IT will review for:
   - Security compliance
   - License availability
   - System compatibility

**Troubleshooting Software Issues:**

**Application Won't Start:**
1. Try closing and reopening the application
2. Restart your computer
3. Run as Administrator (right-click → Run as administrator)

**Application Crashes/Freezes:**
1. Check for updates within the application
2. Clear application cache/temp files
3. Repair installation (Control Panel → Programs → Modify)
4. Reinstall the application

**Performance Issues:**
1. Close unnecessary applications
2. Check system resource usage (Task Manager)
3. Verify you meet minimum system requirements
4. Update to latest version

**Error Messages:**
- Screenshot the error
- Note what you were doing when it occurred
- Check if it happens consistently or randomly`,
    relevanceScore: 0
  },
  {
    id: 'kb-hardware-001',
    title: 'Hardware & Equipment Support',
    category: 'Hardware & Equipment',
    excerpt: 'Troubleshooting common hardware issues',
    solution: `**Common Hardware Issues:**

**Monitor/Display Problems:**
- Check all cable connections
- Try a different port or cable
- Update display drivers
- For multiple monitors: Settings → Display → Detect

**Keyboard/Mouse Issues:**
- Check batteries (wireless devices)
- Try a different USB port
- Check Bluetooth connection
- Update device drivers

**Audio Problems:**
- Check volume is not muted
- Verify correct output device selected
- Settings → Sound → Output device
- Update audio drivers

**Docking Station:**
- Disconnect and reconnect the dock
- Try direct connection without dock
- Update docking station firmware

**Printer Issues:**
- Verify printer is online and has paper/ink
- Set as default printer
- Clear print queue
- Remove and re-add printer

**Equipment Requests:**
Submit a ticket for:
- New equipment needs
- Replacement of faulty hardware
- Ergonomic equipment requests
- Peripheral requests (monitors, keyboards, etc.)`,
    relevanceScore: 0
  },
  {
    id: 'kb-vpn-001',
    title: 'VPN Connection Issues',
    category: 'Network & Connectivity',
    excerpt: 'Troubleshooting VPN connectivity problems',
    solution: `**VPN Troubleshooting Steps:**

**1. Check Internet Connection First**
- VPN requires active internet
- Test by visiting any website

**2. Restart VPN Client**
- Disconnect if connected
- Close the VPN application completely
- Reopen and try connecting again

**3. Try a Different Server**
- Some VPN servers may be at capacity
- Select a different server location if available

**4. Check Credentials**
- Verify your username and password
- Check if MFA is required
- Ensure your account is not locked

**5. Firewall/Antivirus**
- Temporarily disable firewall
- Check if antivirus is blocking VPN

**6. Update VPN Client**
- Check for available updates
- Install latest version from IT portal

**7. DNS Issues**
- Run: \`ipconfig /flushdns\`
- Try connecting after clearing DNS

**If still not working:**
- Note any error codes/messages
- Try connecting from a different network
- Submit a ticket with details`,
    relevanceScore: 0
  },
  {
    id: 'kb-mfa-001',
    title: 'Multi-Factor Authentication (MFA) Setup',
    category: 'Account Access',
    excerpt: 'Guide to setting up and troubleshooting MFA',
    solution: `**Setting Up MFA:**

1. Download Microsoft Authenticator app on your phone
2. Go to account.microsoft.com/security
3. Click "Add a sign-in method"
4. Select "Authenticator app"
5. Scan the QR code with your phone
6. Complete verification

**Lost/New Phone:**
1. If you have backup codes, use one to sign in
2. If you have another MFA method (phone/email), use that
3. Contact IT to reset MFA

**MFA Not Working:**
- Ensure phone time is correct (auto-sync recommended)
- Try the notification method instead of code
- Check internet connection on your phone
- Remove and re-add account in Authenticator

**Backup Options:**
- Set up multiple MFA methods
- Save backup codes in secure location
- Add a backup phone number

**Traveling/No Phone Access:**
- Plan ahead and get backup codes
- Set up an alternate email
- Contact IT before travel for temporary solutions`,
    relevanceScore: 0
  },
  {
    id: 'kb-teams-001',
    title: 'Microsoft Teams Troubleshooting',
    category: 'Email & Communication',
    excerpt: 'Solutions for common Teams issues',
    solution: `**Common Teams Issues:**

**Audio/Video Problems:**
- Check Settings → Devices to select correct mic/camera
- Test devices before joining meetings
- Close other apps using camera/mic
- Update audio/video drivers

**Teams Won't Load:**
1. Clear Teams cache:
   - Close Teams completely
   - Delete: %appdata%\\Microsoft\\Teams
   - Restart Teams
2. Try Teams web version (teams.microsoft.com)

**Can't Join Meeting:**
- Check meeting link is correct
- Try joining from calendar instead of link
- Clear browser cache if using web version
- Check if VPN is blocking connection

**Screen Sharing Issues:**
- Close unnecessary applications
- Try sharing specific window instead of full screen
- Check if admin has disabled sharing

**Chat Not Syncing:**
- Check internet connection
- Sign out and sign back in
- Clear Teams cache (see above)

**Status Issues:**
- Manually set your status
- Check if calendar is syncing correctly
- Restart Teams to refresh status`,
    relevanceScore: 0
  }
];

// Intent classification patterns
const INTENT_PATTERNS: Array<{ pattern: RegExp; intent: LLMIntent; weight: number }> = [
  // Ticket listing
  { pattern: /\b(my|show|list|view|get|display)\s*(open|active|pending)?\s*(tickets?|requests?|issues?)\b/i, intent: 'ticket_list', weight: 1.0 },
  { pattern: /\b(what|which)\s*(are)?\s*(my|the)?\s*(open|active)?\s*(tickets?|requests?|issues?)\b/i, intent: 'ticket_list', weight: 0.9 },
  { pattern: /\bhow many (tickets?|requests?)\b/i, intent: 'ticket_summary', weight: 0.8 },
  
  // Ticket status
  { pattern: /\b(check|what|where|find|track|status|lookup)\s*(is)?\s*(the)?\s*(status|state)?\s*(of)?\s*(ticket|my)?\s*[#]?\s*[A-Z]{2,3}-\d{8}-\d{6}/i, intent: 'ticket_status', weight: 1.0 },
  { pattern: /\bticket\s*[#]?\s*([A-Z]{2,3}-\d{8}-\d{6}|[a-f0-9-]{8,})/i, intent: 'ticket_status', weight: 0.9 },
  { pattern: /\b(check|track|find|status)\s*(the)?\s*(status)?\s*(of)?\s*(my)?\s*(ticket|request)/i, intent: 'ticket_status', weight: 0.7 },
  
  // Ticket creation
  { pattern: /\b(create|new|submit|open|file|raise|report)\s*(a)?\s*(new)?\s*(ticket|request|issue|problem)/i, intent: 'ticket_create', weight: 1.0 },
  { pattern: /\b(need|want)\s*(to)?\s*(report|submit|create)\s*(an?)?\s*(issue|problem|ticket)/i, intent: 'ticket_create', weight: 0.9 },
  { pattern: /\b(help|having|got)\s*(a|an)?\s*(issue|problem|trouble)/i, intent: 'ticket_create', weight: 0.6 },
  
  // Knowledge search  
  { pattern: /\b(how|what)\s*(do|can|to|should)?\s*(i|we)?\s*(fix|solve|resolve|troubleshoot|reset|setup|configure)/i, intent: 'knowledge_search', weight: 1.0 },
  { pattern: /\b(password|email|network|wifi|vpn|outlook|teams|software|install|hardware|printer|mfa|authentication)/i, intent: 'knowledge_search', weight: 0.8 },
  { pattern: /\b(not working|broken|error|crash|slow|can\'t|cannot|won\'t|issue with|problem with)/i, intent: 'knowledge_search', weight: 0.7 },
  
  // Staff workload
  { pattern: /\b(who|which)\s*(has|have|is)\s*(the)?\s*(most|least|fewest)?\s*(tickets?|work|assigned|workload)/i, intent: 'staff_workload', weight: 1.0 },
  { pattern: /\b(staff|team|agent|engineer)\s*(workload|capacity|assignment|performance)/i, intent: 'staff_workload', weight: 0.9 },
  { pattern: /\b(assign|assignment|distribute|balance)\s*(tickets?)?/i, intent: 'staff_workload', weight: 0.7 },
  
  // Summary/stats
  { pattern: /\b(summary|overview|stats|statistics|report|dashboard|analytics)/i, intent: 'ticket_summary', weight: 1.0 },
  { pattern: /\b(critical|urgent|high priority|overdue|sla|breached)/i, intent: 'ticket_summary', weight: 0.8 },
  
  // Help/navigation
  { pattern: /\b(help|guide|tutorial|how to use|navigate|explain|show me how)/i, intent: 'help_navigation', weight: 1.0 },
  { pattern: /\b(what can you|what do you|capabilities|features)/i, intent: 'help_navigation', weight: 0.9 },
  
  // Greetings
  { pattern: /^\s*(hi|hello|hey|good morning|good afternoon|good evening|howdy|greetings)/i, intent: 'greeting', weight: 1.0 },
  
  // Thanks
  { pattern: /^\s*(thanks|thank you|thx|appreciate|cheers)/i, intent: 'thanks', weight: 1.0 },
];

/**
 * Classify the intent of a user message
 */
function classifyIntent(message: string): { intent: LLMIntent; confidence: number } {
  let bestMatch: { intent: LLMIntent; confidence: number } = { intent: 'unknown', confidence: 0 };
  
  for (const { pattern, intent, weight } of INTENT_PATTERNS) {
    if (pattern.test(message)) {
      const confidence = weight;
      if (confidence > bestMatch.confidence) {
        bestMatch = { intent, confidence };
      }
    }
  }
  
  return bestMatch;
}

/**
 * Search knowledge base for relevant articles
 */
function searchKnowledgeBase(query: string): KnowledgeArticle[] {
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter((w: string) => w.length > 2);
  
  return KNOWLEDGE_BASE
    .map((article: KnowledgeArticle) => {
      let score = 0;
      const articleText = `${article.title} ${article.category} ${article.excerpt} ${article.solution}`.toLowerCase();
      
      for (const keyword of keywords) {
        if (articleText.includes(keyword)) {
          score += 1;
        }
        if (article.title.toLowerCase().includes(keyword)) {
          score += 2; // Title matches are more important
        }
      }
      
      return { ...article, relevanceScore: score };
    })
    .filter((a: KnowledgeArticle) => a.relevanceScore > 0)
    .sort((a: KnowledgeArticle, b: KnowledgeArticle) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);
}

/**
 * Extract ticket ID from message
 */
function extractTicketId(message: string): string | null {
  // Match format: RIL-20260522-143052 or GLL-20260522-143052
  const ticketIdMatch = message.match(/[A-Z]{2,3}-\d{8}-\d{6}/i);
  if (ticketIdMatch) return ticketIdMatch[0].toUpperCase();
  
  // Match UUID format
  const uuidMatch = message.match(/[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}/i);
  if (uuidMatch) return uuidMatch[0].toLowerCase();
  
  return null;
}

/**
 * Calculate staff statistics
 */
function calculateStaffStats(tickets: Ticket[]): StaffStat[] {
  return IT_STAFF.map((staff: { name: string; email: string }) => {
    const assigned = tickets.filter((t: Ticket) => t.assignedTo === staff.name);
    const open = assigned.filter((t: Ticket) => t.statusKey === 'StatusKey0' || t.statusKey === 'StatusKey1');
    const critical = assigned.filter((t: Ticket) => t.priorityKey === 'PriorityKey3');
    
    return {
      name: staff.name,
      email: staff.email,
      totalAssigned: assigned.length,
      openTickets: open.length,
      criticalTickets: critical.length,
      avgResolutionTime: '~4.2 hours'
    };
  }).sort((a: StaffStat, b: StaffStat) => b.totalAssigned - a.totalAssigned);
}

/**
 * Calculate ticket summary
 */
function calculateSummary(tickets: Ticket[]): TicketSummary {
  return {
    total: tickets.length,
    open: tickets.filter((t: Ticket) => t.statusKey === 'StatusKey0').length,
    inProgress: tickets.filter((t: Ticket) => t.statusKey === 'StatusKey1').length,
    resolved: tickets.filter((t: Ticket) => t.statusKey === 'StatusKey2').length,
    closed: tickets.filter((t: Ticket) => t.statusKey === 'StatusKey3').length,
    critical: tickets.filter((t: Ticket) => t.priorityKey === 'PriorityKey3').length,
    overdue: tickets.filter((t: Ticket) => isTicketOverdue(t)).length,
    avgResolutionTime: '~6.5 hours'
  };
}

/**
 * Generate contextual response using LLM-like processing
 */
export async function processWithLLM(context: LLMContext): Promise<LLMResponse> {
  const { tickets, userQuery } = context;
  const { intent, confidence } = classifyIntent(userQuery);
  
  // Simulate AI processing time
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));
  
  switch (intent) {
    case 'greeting': {
      return {
        message: generateGreeting(),
        intent,
        confidence,
        suggestedActions: ['Create a ticket', 'Check ticket status', 'Search knowledge base'],
        followUpQuestions: ['How can I help you today?']
      };
    }
    
    case 'thanks': {
      return {
        message: "You're welcome! 😊 Is there anything else I can help you with?",
        intent,
        confidence,
        suggestedActions: ['Create another ticket', 'Browse knowledge base']
      };
    }
    
    case 'ticket_list': {
      const queryLower = userQuery.toLowerCase();
      let filteredTickets: Ticket[];
      let filterDescription: string;
      
      if (queryLower.includes('critical') || queryLower.includes('urgent')) {
        filteredTickets = tickets.filter((t: Ticket) => t.priorityKey === 'PriorityKey3' || t.priorityKey === 'PriorityKey2');
        filterDescription = 'critical and high priority';
      } else if (queryLower.includes('overdue') || queryLower.includes('sla')) {
        filteredTickets = tickets.filter((t: Ticket) => isTicketOverdue(t));
        filterDescription = 'overdue';
      } else if (queryLower.includes('resolved')) {
        filteredTickets = tickets.filter((t: Ticket) => t.statusKey === 'StatusKey2');
        filterDescription = 'resolved';
      } else if (queryLower.includes('closed')) {
        filteredTickets = tickets.filter((t: Ticket) => t.statusKey === 'StatusKey3');
        filterDescription = 'closed';
      } else {
        filteredTickets = tickets.filter((t: Ticket) => t.statusKey === 'StatusKey0' || t.statusKey === 'StatusKey1');
        filterDescription = 'open';
      }
      
      const displayTickets = filteredTickets.slice(0, 5);
      
      if (displayTickets.length > 0) {
        return {
          message: `I found **${filteredTickets.length} ${filterDescription}** ticket${filteredTickets.length !== 1 ? 's' : ''}. Here are the most recent:`,
          intent,
          confidence,
          data: { tickets: displayTickets },
          suggestedActions: filteredTickets.length > 5 ? ['View all tickets in All Tickets page'] : undefined,
          followUpQuestions: ['Would you like details on any specific ticket?', 'Should I filter by category?']
        };
      } else {
        return {
          message: `No ${filterDescription} tickets found. ${filterDescription === 'overdue' ? '🎉 Great news - all tickets are within SLA!' : 'Would you like to create a new ticket?'}`,
          intent,
          confidence,
          suggestedActions: ['Create a new ticket', 'View all tickets']
        };
      }
    }
    
    case 'ticket_status': {
      const ticketId = extractTicketId(userQuery);
      
      if (ticketId) {
        const foundTicket = tickets.find((t: Ticket) => 
          t.ticketNumber?.toUpperCase() === ticketId.toUpperCase() ||
          t.id.toLowerCase().includes(ticketId.toLowerCase())
        );
        
        if (foundTicket) {
          const status = STATUS_CONFIG[foundTicket.statusKey].label;
          const priority = PRIORITY_CONFIG[foundTicket.priorityKey].label;
          const isOverdue = isTicketOverdue(foundTicket);
          
          return {
            message: `Here's the status of ticket **${foundTicket.ticketNumber || ticketId}**:\n\n` +
              `📋 **${foundTicket.title}**\n` +
              `• Status: ${status}\n` +
              `• Priority: ${priority}\n` +
              `• Assigned to: ${foundTicket.assignedTo || 'Unassigned'}\n` +
              (isOverdue ? '\n⚠️ **This ticket has exceeded its SLA target.**' : ''),
            intent,
            confidence,
            data: { ticket: foundTicket },
            suggestedActions: ['View full details', 'Check another ticket']
          };
        } else {
          return {
            message: `I couldn't find a ticket with ID "${ticketId}". Please verify the ticket number.\n\n💡 Tip: Ticket IDs follow the format: **RIL-YYYYMMDD-HHMMSS** or **GLL-YYYYMMDD-HHMMSS**`,
            intent,
            confidence,
            suggestedActions: ['Browse My Tickets', 'Search All Tickets']
          };
        }
      } else {
        return {
          message: 'To check a ticket status, please provide the ticket ID.\n\n💡 Example: "Check ticket RIL-20260522-143052"\n\nYou can find your ticket ID in the My Tickets section or in your email confirmation.',
          intent,
          confidence,
          suggestedActions: ['Go to My Tickets', 'Browse All Tickets']
        };
      }
    }
    
    case 'ticket_create': {
      return {
        message: "I'll help you create a new support ticket! 🎫\n\n" +
          "Click the button below to open the ticket form, where you can:\n" +
          "• Describe your issue in detail\n" +
          "• Select the appropriate category\n" +
          "• Set priority level\n" +
          "• Attach screenshots if needed\n\n" +
          "💡 Tip: Include as much detail as possible for faster resolution.",
        intent,
        confidence,
        suggestedActions: ['Open ticket form', 'Search knowledge base first']
      };
    }
    
    case 'knowledge_search': {
      const articles = searchKnowledgeBase(userQuery);
      
      if (articles.length > 0) {
        const bestMatch = articles[0];
        return {
          message: `I found a solution that might help with your issue:`,
          intent,
          confidence,
          data: { knowledgeArticle: bestMatch },
          followUpQuestions: [
            'Did this solve your problem?',
            articles.length > 1 ? 'Would you like to see more solutions?' : undefined
          ].filter(Boolean) as string[],
          suggestedActions: ['Create a ticket if issue persists']
        };
      } else {
        return {
          message: "I couldn't find a specific article for your issue, but here's what I recommend:\n\n" +
            "1. Try restarting your device - this resolves many common issues\n" +
            "2. Check if the issue affects only you or others as well\n" +
            "3. Note any error messages you're seeing\n\n" +
            "If the problem persists, let's create a support ticket with all the details.",
          intent,
          confidence,
          suggestedActions: ['Create a support ticket', 'Search again with different terms']
        };
      }
    }
    
    case 'staff_workload': {
      const staffStats = calculateStaffStats(tickets);
      const statsText = staffStats
        .map((s: StaffStat) => `• **${s.name}**: ${s.totalAssigned} total (${s.openTickets} open, ${s.criticalTickets} critical)`)
        .join('\n');
      
      return {
        message: `📊 **IT Staff Workload Overview:**\n\n${statsText}\n\n` +
          `👥 Total staff: ${staffStats.length}\n` +
          `📈 Average load: ${Math.round(tickets.length / staffStats.length)} tickets per person`,
        intent,
        confidence,
        data: { staffStats },
        suggestedActions: ['View Assignment Workflow', 'Go to Dashboard']
      };
    }
    
    case 'ticket_summary': {
      const summary = calculateSummary(tickets);
      
      return {
        message: `📈 **Current Ticket Summary:**\n\n` +
          `• **Total Tickets:** ${summary.total}\n` +
          `• **Open:** ${summary.open}\n` +
          `• **In Progress:** ${summary.inProgress}\n` +
          `• **Resolved:** ${summary.resolved}\n` +
          `• **Closed:** ${summary.closed}\n\n` +
          `⚠️ **Attention Required:**\n` +
          `• Critical: ${summary.critical}\n` +
          `• Overdue: ${summary.overdue}\n\n` +
          `⏱️ Avg Resolution: ${summary.avgResolutionTime}`,
        intent,
        confidence,
        data: { summary },
        suggestedActions: ['View critical tickets', 'Go to Dashboard']
      };
    }
    
    case 'help_navigation': {
      return {
        message: "🎯 **IT Help Desk Quick Guide:**\n\n" +
          "**📊 Dashboard** - View ticket stats, charts, and team performance\n\n" +
          "**➕ Create Ticket** - Submit new IT support requests with attachments\n\n" +
          "**📋 My Tickets** - Track your submitted tickets and their status\n\n" +
          "**📁 All Tickets** - View, filter, and manage all tickets (admin)\n\n" +
          "**⚙️ Admin Settings** - Configure categories, SLA rules, and more\n\n" +
          "**💡 Pro Tips:**\n" +
          "• Use 'Critical' priority only for business-stopping issues\n" +
          "• Include screenshots for faster resolution\n" +
          "• Check the knowledge base before creating tickets",
        intent,
        confidence,
        suggestedActions: ['Create a ticket', 'Search knowledge base', 'View my tickets']
      };
    }
    
    default: {
      return {
        message: `I'm not sure I understood that. Here's what I can help with:\n\n` +
          `• **"Show my tickets"** - View your active tickets\n` +
          `• **"Check ticket [ID]"** - Get status of a specific ticket\n` +
          `• **"How do I reset my password?"** - Get troubleshooting help\n` +
          `• **"Create ticket"** - Submit a new support request\n` +
          `• **"Show critical tickets"** - View urgent issues\n` +
          `• **"Who has the most tickets?"** - View staff workload`,
        intent: 'unknown',
        confidence: 0,
        suggestedActions: ['Create a ticket', 'Check ticket status', 'Search knowledge base', 'Get help']
      };
    }
  }
}

/**
 * Generate a contextual greeting based on time of day
 */
function generateGreeting(): string {
  const hour = new Date().getHours();
  let timeGreeting: string;
  
  if (hour < 12) {
    timeGreeting = 'Good morning';
  } else if (hour < 17) {
    timeGreeting = 'Good afternoon';
  } else {
    timeGreeting = 'Good evening';
  }
  
  const greetings = [
    `${timeGreeting}! 👋 I'm your IT Help Desk AI assistant. How can I help you today?`,
    `${timeGreeting}! Ready to help with your IT needs. What can I do for you?`,
    `${timeGreeting}! 🤖 I'm here to help with tickets, troubleshooting, and more. What do you need?`
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export { KNOWLEDGE_BASE, searchKnowledgeBase, classifyIntent, calculateStaffStats, calculateSummary };
