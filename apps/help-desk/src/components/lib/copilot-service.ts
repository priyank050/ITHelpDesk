/**
 * Copilot API Service for IT Help Desk
 * 
 * Integrates with Azure OpenAI Copilot API for advanced natural language understanding.
 * Includes RAG (Retrieval-Augmented Generation) for context-aware responses.
 */

import type { Ticket } from './generated/models/ticket-model';
import { KNOWLEDGE_BASE, searchKnowledgeBase, calculateStaffStats, calculateSummary } from './llm-service';
import type { KnowledgeArticle, StaffStat, TicketSummary } from './llm-service';
import { STATUS_CONFIG, PRIORITY_CONFIG, isTicketOverdue } from './lib/ticket-utils';

// ==========================================
// PREDEFINED Q&A DATABASE
// ==========================================

export interface PredefinedQA {
  id: string;
  category: string;
  questions: string[];  // Multiple ways to ask the same question
  answer: string;
  followUpQuestions?: string[];
  relatedQAs?: string[];  // IDs of related Q&As
}

export const PREDEFINED_QA_DATABASE: PredefinedQA[] = [

  {
    id: 'qa-account-locked',
    category: 'Account Access',
    questions: [
      'My account is locked',
      'Account locked out',
      'Can\'t login',
      'Too many failed attempts',
      'Unlock my account',
      'Account disabled'
    ],
    answer: `**If your account is locked:**\n\n🔒 Accounts lock after **5 failed login attempts** for security.\n\n**Option 1: Wait**\n• Account auto-unlocks after **15 minutes**\n\n**Option 2: Self-Service**\n• Use the "Forgot Password" link to reset credentials\n• This also unlocks your account\n\n**Option 3: Contact IT**\n• Submit a **High Priority** ticket for immediate unlock\n• Include your employee ID for faster verification\n\n⚠️ **Warning:** If you didn't make the failed attempts, your account may be compromised. Contact IT immediately.`,
    followUpQuestions: ['How do I reset my password?', 'Is my account compromised?'],
    relatedQAs: ['qa-password-reset', 'qa-security-concern']
  },
  {
    id: 'qa-mfa-setup',
    category: 'Account Access',
    questions: [
      'How do I set up MFA?',
      'Enable two-factor authentication',
      'Setup authenticator app',
      'MFA setup',
      '2FA setup',
      'Add authentication method'
    ],
    answer: `**Setting Up Multi-Factor Authentication (MFA):**\n\n📱 **Step 1: Download App**\n• Install **Microsoft Authenticator** from App Store/Play Store\n\n🌐 **Step 2: Go to Security Settings**\n• Visit account.microsoft.com/security\n• Click "Add a sign-in method"\n\n📷 **Step 3: Connect**\n• Select "Authenticator app"\n• Scan the QR code with your phone\n• Complete verification\n\n✅ **Best Practices:**\n• Set up **multiple methods** (phone + email as backup)\n• Save **backup codes** securely\n• Enable **notifications** for quick approval\n\n💡 MFA is **required** for all employees by company policy.`,
    followUpQuestions: ['I lost my phone, how do I login?', 'MFA not working'],
    relatedQAs: ['qa-mfa-lost-phone', 'qa-mfa-not-working']
  },
  {
    id: 'qa-mfa-lost-phone',
    category: 'Account Access',
    questions: [
      'Lost my phone can\'t login',
      'New phone MFA',
      'MFA on new device',
      'Can\'t access authenticator',
      'Phone broken can\'t login'
    ],
    answer: `**Lost/Changed Phone? Here's how to regain access:**\n\n🔑 **If you have backup codes:**\n1. Use a backup code to sign in\n2. Then set up MFA on your new device\n\n📧 **If you set up alternate methods:**\n1. Use phone call or email verification\n2. Then update your primary method\n\n🆘 **No backup options?**\n1. Contact IT Support immediately\n2. Submit a **Critical Priority** ticket\n3. You'll need to verify identity in person or via manager\n\n⚠️ **Prevention for next time:**\n• Save backup codes in a secure location\n• Add a secondary phone number\n• Set up email as backup verification`,
    followUpQuestions: ['How do I set up backup methods?', 'How long until my account is recovered?'],
    relatedQAs: ['qa-mfa-setup']
  },
  {
    id: 'qa-mfa-not-working',
    category: 'Account Access',
    questions: [
      'MFA code not working',
      'Authenticator not accepting code',
      'Wrong code MFA',
      'MFA keeps failing'
    ],
    answer: `**MFA Code Not Working? Try these fixes:**\n\n⏰ **1. Check Time Sync**\n• Codes are time-sensitive\n• Enable auto-time on your phone:\n  - iOS: Settings → General → Date & Time → Set Automatically\n  - Android: Settings → Date & Time → Automatic\n\n🔄 **2. Use Notification Instead**\n• Try the "Approve" notification method\n• More reliable than typing codes\n\n📱 **3. Refresh Account**\n• Remove the account from Authenticator\n• Re-add it from scratch\n\n📶 **4. Check Connectivity**\n• Ensure your phone has internet\n• Notifications require data/WiFi\n\n🔄 **5. Update App**\n• Make sure Authenticator is up to date`,
    followUpQuestions: ['Set up MFA again', 'Contact IT support'],
    relatedQAs: ['qa-mfa-setup']
  },
  
  // Network & VPN

  {
    id: 'qa-network-troubleshoot',
    category: 'Network',
    questions: [
      'No internet connection',
      'Network not working',
      'WiFi not connecting',
      'Can\'t access network',
      'Internet is down'
    ],
    answer: `**Network Connectivity Troubleshooting:**\n\n🔌 **Step 1: Check Physical**\n• WiFi: Verify you're on correct network\n• Wired: Check cable is secure\n• Docking station: Reconnect dock\n\n🔄 **Step 2: Restart**\n• Turn WiFi off → wait 10 sec → on\n• Restart computer\n• Restart router (home users)\n\n⚙️ **Step 3: Network Diagnostics**\n• Windows: Settings → Network → Troubleshoot\n• Mac: System Preferences → Network → Assist me\n\n🧹 **Step 4: Clear DNS**\n• Open Command Prompt as Admin\n• Run: \`ipconfig /flushdns\`\n• Run: \`ipconfig /release\`\n• Run: \`ipconfig /renew\`\n\n📊 **Check if Widespread:**\n• Ask nearby colleagues\n• Check service status page`,
    followUpQuestions: ['Network still not working', 'Is there an outage?'],
    relatedQAs: ['qa-vpn-issues', 'qa-network-slow']
  },
  {
    id: 'qa-network-slow',
    category: 'Network',
    questions: [
      'Internet is slow',
      'Network is slow',
      'Slow connection',
      'Pages loading slowly',
      'Downloads taking forever'
    ],
    answer: `**Improving Network Speed:**\n\n📊 **Diagnose:**\n• Speed test: fast.com or speedtest.net\n• Compare with expected speed\n\n🔌 **Quick Improvements:**\n1. Use wired connection instead of WiFi\n2. Move closer to router\n3. Close bandwidth-heavy apps (Teams, streaming)\n4. Disconnect unused devices\n\n🔄 **Technical Fixes:**\n1. Restart router/modem\n2. Clear browser cache\n3. Disable browser extensions\n4. Update network drivers\n\n📱 **Home Network:**\n• Use 5GHz band if available\n• Check for interference (microwaves, etc.)\n• Consider mesh WiFi for large spaces\n\n🏢 **Office Network:**\n• Move to less crowded area\n• Check if issue is building-wide\n• Report to IT if persistent`,
    followUpQuestions: ['What speed should I expect?', 'Create ticket for slow network'],
    relatedQAs: ['qa-network-troubleshoot']
  },
  
  // Email & Communication
  {
    id: 'qa-email-not-syncing',
    category: 'Email',
    questions: [
      'Email not syncing',
      'Outlook not syncing',
      'Not receiving emails',
      'Email delayed',
      'Inbox not updating'
    ],
    answer: `**Email Sync Issues:**\n\n🔄 **Quick Sync:**\n• Click Send/Receive → Send/Receive All\n• Or press F9\n\n🌐 **Check Webmail:**\n• Go to outlook.office.com\n• Are emails there? If yes, sync issue\n• If no, emails haven't arrived yet\n\n🔧 **Repair Outlook:**\n1. File → Account Settings\n2. Select your account\n3. Click "Repair"\n4. Follow prompts\n\n🗄️ **Clear Cache:**\n1. Close Outlook\n2. Open: %localappdata%\\Microsoft\\Outlook\n3. Delete .ost file\n4. Restart Outlook (will re-sync)\n\n📧 **Check Rules:**\n• Rules may be moving emails\n• File → Manage Rules & Alerts\n\n📁 **Check All Folders:**\n• Junk/Spam folder\n• Focused vs Other inbox\n• Archive folder`,
    followUpQuestions: ['Outlook keeps crashing', 'Can\'t send emails'],
    relatedQAs: ['qa-email-cant-send', 'qa-outlook-crash']
  },
  {
    id: 'qa-email-cant-send',
    category: 'Email',
    questions: [
      'Can\'t send email',
      'Email stuck in outbox',
      'Failed to send',
      'Email won\'t send',
      'Send error outlook'
    ],
    answer: `**Can't Send Email? Try These:**\n\n📤 **Check Outbox:**\n• Open Outbox folder\n• Is email stuck there?\n• Double-click → check for errors\n\n📎 **Attachment Issues:**\n• Max size: **25MB**\n• Large files: Use SharePoint/OneDrive link\n• Blocked types: .exe, .bat, .cmd\n\n✉️ **Recipient Issues:**\n• Verify email address is correct\n• Check for typos\n• External recipients may be blocked\n\n🔌 **Connection:**\n• Check internet connection\n• Try sending to yourself first\n\n🔄 **Force Resend:**\n1. Open stuck email from Outbox\n2. Click Send again\n3. If fails, delete and recreate\n\n⚙️ **Account Settings:**\n• File → Account Settings\n• Check SMTP settings are correct`,
    followUpQuestions: ['What\'s the attachment limit?', 'Email keeps bouncing'],
    relatedQAs: ['qa-email-not-syncing']
  },
  {
    id: 'qa-outlook-crash',
    category: 'Email',
    questions: [
      'Outlook keeps crashing',
      'Outlook not responding',
      'Outlook freezing',
      'Outlook won\'t open',
      'Outlook crashes on startup'
    ],
    answer: `**Fixing Outlook Crashes:**\n\n🛡️ **Safe Mode:**\n1. Hold CTRL while clicking Outlook\n2. Click "Yes" to start in Safe Mode\n3. If works, an add-in is causing issues\n\n🔌 **Disable Add-ins:**\n1. File → Options → Add-ins\n2. Click "Manage COM Add-ins" → Go\n3. Uncheck all → OK\n4. Re-enable one at a time to find culprit\n\n🔧 **Repair Office:**\n1. Control Panel → Programs\n2. Find Microsoft 365\n3. Click Change → Quick Repair\n4. If that fails, try Online Repair\n\n🗃️ **Fix Data File:**\n1. Close Outlook\n2. Search "SCANPST.EXE" on C: drive\n3. Run it on your .pst/.ost file\n\n🔄 **Create New Profile:**\n1. Control Panel → Mail → Show Profiles\n2. Add new profile\n3. Set as default`,
    followUpQuestions: ['Repair didn\'t help', 'Need to reinstall Office'],
    relatedQAs: ['qa-email-not-syncing']
  },
  {
    id: 'qa-teams-issues',
    category: 'Communication',
    questions: [
      'Teams not working',
      'Teams video not working',
      'Can\'t hear in Teams',
      'Teams audio issues',
      'Teams camera not working'
    ],
    answer: `**Microsoft Teams Troubleshooting:**\n\n🎤 **Audio Issues:**\n1. Settings (⚙️) → Devices\n2. Check Speaker and Microphone selected\n3. Click "Make a test call"\n4. Adjust levels if needed\n\n📹 **Video Issues:**\n1. Settings → Devices → Camera\n2. Select correct camera\n3. Check if camera in use by other app\n4. Update camera drivers\n\n🔄 **General Fixes:**\n1. Quit Teams completely\n2. Clear cache:\n   - %appdata%\\Microsoft\\Teams\n   - Delete Cache folder\n3. Restart Teams\n\n🌐 **Use Web Version:**\n• teams.microsoft.com\n• Good for quick meetings\n• Use if desktop app fails\n\n📞 **In a Meeting:**\n• Click ••• → Device settings\n• Switch devices live\n• Dial-in as backup`,
    followUpQuestions: ['Teams keeps disconnecting', 'Can\'t share screen'],
    relatedQAs: ['qa-teams-screen-share']
  },
  {
    id: 'qa-teams-screen-share',
    category: 'Communication',
    questions: [
      'Can\'t share screen Teams',
      'Screen share not working',
      'Share screen black',
      'Participants can\'t see my screen'
    ],
    answer: `**Teams Screen Sharing Issues:**\n\n🖥️ **Basic Checks:**\n• Are you the presenter? (ask host to promote you)\n• Is screen sharing allowed? (host controls)\n\n⚙️ **Try These:**\n1. Share specific **window** not full screen\n2. Share PowerPoint directly (better performance)\n3. Close unnecessary apps\n\n🔒 **Permission Issues:**\n• Windows: Settings → Privacy → Screen Recording\n• Mac: System Preferences → Security → Screen Recording\n• Ensure Teams has permission\n\n🎮 **GPU/Performance:**\n• Disable GPU sharing: Settings → General\n• Close video-intensive apps\n• Use wired connection\n\n🔄 **Still Not Working:**\n1. Leave and rejoin meeting\n2. Ask someone else to share\n3. Use Teams web version\n4. Share via OneDrive link instead`,
    followUpQuestions: ['Teams meeting best practices'],
    relatedQAs: ['qa-teams-issues']
  },
  
  // Hardware & Equipment
  {
    id: 'qa-request-equipment',
    category: 'Hardware',
    questions: [
      'Request new equipment',
      'Need new laptop',
      'Request monitor',
      'How to get new keyboard',
      'Equipment request process'
    ],
    answer: `**Requesting New Equipment:**\n\n📋 **Standard Equipment:**\n1. Submit ticket: Category → Hardware Request\n2. Include:\n   - Type of equipment needed\n   - Business justification\n   - Your department & cost center\n3. Manager approval required\n4. IT will process and contact you\n\n⏱️ **Typical Timeline:**\n• Standard items: 3-5 business days\n• Special orders: 2-4 weeks\n• Ergonomic equipment: May need assessment\n\n🖥️ **Available for Request:**\n• Laptops (standard & performance)\n• Monitors (24", 27", ultrawide)\n• Keyboards, mice, headsets\n• Docking stations\n• Webcams\n• Ergonomic accessories\n\n💡 **Tip:** For ergonomic needs, request an assessment first - IT can recommend best equipment for your situation.`,
    followUpQuestions: ['What laptops are available?', 'Ergonomic assessment'],
    relatedQAs: ['qa-equipment-broken']
  },
  {
    id: 'qa-equipment-broken',
    category: 'Hardware',
    questions: [
      'Equipment not working',
      'Laptop broken',
      'Monitor not working',
      'Keyboard not working',
      'Hardware issue'
    ],
    answer: `**Hardware Not Working? Quick Troubleshooting:**\n\n🔌 **Universal First Steps:**\n1. Check all cable connections\n2. Try different port/outlet\n3. Restart the device\n4. Restart your computer\n\n🖥️ **Monitor Issues:**\n• Check video cable both ends\n• Try different cable\n• Windows+P to change display mode\n\n⌨️ **Keyboard/Mouse:**\n• Replace batteries (wireless)\n• Try different USB port\n• Check Bluetooth connection\n• Test on another computer\n\n💻 **Laptop Issues:**\n• Won't turn on? Hold power 30 seconds\n• Connect to power, try again\n• Remove from dock, connect directly\n\n🔧 **Still Broken?**\n1. Submit ticket with:\n   - Equipment type & model\n   - What's not working\n   - Steps already tried\n2. IT may replace or repair`,
    followUpQuestions: ['Request replacement', 'Schedule repair'],
    relatedQAs: ['qa-request-equipment']
  },
  {
    id: 'qa-printer-issues',
    category: 'Hardware',
    questions: [
      'Printer not working',
      'Can\'t print',
      'Add printer',
      'Printer offline',
      'Print job stuck'
    ],
    answer: `**Printer Troubleshooting:**\n\n🖨️ **Printer Offline:**\n1. Check printer is ON and connected\n2. Settings → Printers → Right-click → "Use Printer Online"\n3. Set as default printer\n4. Try again\n\n📄 **Jobs Stuck:**\n1. Settings → Printers\n2. Open print queue\n3. Select all → Cancel\n4. Restart Print Spooler:\n   - Services → Print Spooler → Restart\n\n➕ **Add Network Printer:**\n1. Settings → Printers → Add printer\n2. Click "The printer I want isn't listed"\n3. Browse or enter printer path\n4. Or ask IT for printer name\n\n🔧 **Other Issues:**\n• Check paper & ink/toner\n• Try printing from another app\n• Remove and re-add printer\n• Update printer driver\n\n📍 **Find Office Printers:**\n• Check office map/intranet\n• Common format: BLDG-FLOOR-LOCATION`,
    followUpQuestions: ['Which printers are available?', 'Set up secure print'],
    relatedQAs: ['qa-equipment-broken']
  },
  
  // Software
  {
    id: 'qa-install-software',
    category: 'Software',
    questions: [
      'Install software',
      'Request software',
      'Need new application',
      'Download program',
      'Software request'
    ],
    answer: `**Software Installation & Requests:**\n\n📦 **Self-Service (Company Portal):**\n1. Open **Company Portal** / **Software Center**\n2. Browse available apps\n3. Click Install\n4. Available apps are pre-approved\n\n📝 **Request New Software:**\n1. Submit ticket: Category → Software Request\n2. Include:\n   - Software name & version\n   - Business justification\n   - Who will use it\n   - Licensing info (if known)\n\n⏱️ **Approval Timeline:**\n• Pre-approved software: Same day\n• New requests: 2-5 business days\n• Enterprise licenses: May take longer\n\n⚠️ **Important Notes:**\n• Don't install unauthorized software\n• Free software still needs approval\n• Cloud/SaaS apps need security review\n\n💡 **Alternatives:**\n• Check if similar tool already available\n• Web versions may work without install`,
    followUpQuestions: ['What software is available?', 'Why was my request denied?'],
    relatedQAs: ['qa-software-not-working']
  },
  {
    id: 'qa-software-not-working',
    category: 'Software',
    questions: [
      'Software not working',
      'Application crashing',
      'App won\'t open',
      'Program freezing',
      'Software error'
    ],
    answer: `**Application Troubleshooting:**\n\n🔄 **Basic Steps:**\n1. Close app completely (check Task Manager)\n2. Restart computer\n3. Try again\n\n👤 **Run as Admin:**\n1. Right-click app\n2. "Run as administrator"\n3. May fix permission issues\n\n🔧 **Repair Installation:**\n1. Control Panel → Programs\n2. Find the application\n3. Click Modify/Repair\n\n🆕 **Check for Updates:**\n• Most apps: Help → Check for Updates\n• Or reinstall from Company Portal\n\n🗑️ **Clean Reinstall:**\n1. Uninstall from Programs\n2. Delete leftover folders:\n   - %appdata%\\[AppName]\n   - %localappdata%\\[AppName]\n3. Reinstall fresh\n\n📸 **For IT Ticket:**\n• Screenshot any errors\n• Note when issue started\n• Does it affect only you?`,
    followUpQuestions: ['Still not working', 'Request alternative software'],
    relatedQAs: ['qa-install-software']
  },
  
  // Ticket & Support
  {
    id: 'qa-create-ticket',
    category: 'Support',
    questions: [
      'How to create ticket',
      'Submit support request',
      'Report an issue',
      'Get IT help',
      'Contact IT support'
    ],
    answer: `**Creating an Effective Support Ticket:**\n\n📝 **Via This Chat:**\n• Just say "Create a ticket" and I'll guide you!\n\n🖱️ **Via Portal:**\n1. Click "Create Ticket" in the menu\n2. Fill out the form\n3. Submit\n\n✅ **Tips for Faster Resolution:**\n\n**1. Clear Title**\n• Bad: "Help"\n• Good: "Outlook crashes when opening attachments"\n\n**2. Include Details**\n• What happened?\n• When did it start?\n• What were you doing?\n• Error messages?\n\n**3. Right Priority**\n• 🔴 Critical: Business stopped\n• 🟠 High: Major impact\n• 🟡 Medium: Workaround exists\n• 🟢 Low: No urgency\n\n**4. Attach Screenshots**\n• Error messages\n• Before/after states\n• Relevant info\n\n⏱️ **Response Times:**\n• Critical: 1 hour\n• High: 4 hours\n• Medium: 1 day\n• Low: 3 days`,
    followUpQuestions: ['Check my ticket status', 'What priority should I use?'],
    relatedQAs: ['qa-ticket-status', 'qa-ticket-priority']
  },
  {
    id: 'qa-ticket-status',
    category: 'Support',
    questions: [
      'Check ticket status',
      'Where is my ticket',
      'Ticket update',
      'What happened to my request',
      'Track my ticket'
    ],
    answer: `**Checking Your Ticket Status:**\n\n🔍 **Via This Chat:**\n• Say "Check ticket [YOUR-ID]" (e.g., RIL-20260522-143052)\n• Or "Show my tickets"\n\n📋 **Via Portal:**\n1. Go to "My Tickets"\n2. Find your ticket\n3. Click for full details\n\n📊 **Status Meanings:**\n\n🔵 **Open** - Received, waiting for assignment\n🟡 **In Progress** - Technician working on it\n🟢 **Resolved** - Fix applied, awaiting confirmation\n⚫ **Closed** - Complete\n\n💬 **Need Update?**\n• Add a comment to your ticket\n• Technician will be notified\n\n📧 **Email Notifications:**\n• You get emails on status changes\n• Check spam folder if missing\n\n⚠️ **If Urgent:**\n• Reply to ticket email\n• Call IT hotline: ext 4357`,
    followUpQuestions: ['My ticket has been open too long', 'Escalate my ticket'],
    relatedQAs: ['qa-create-ticket', 'qa-escalate-ticket']
  },
  {
    id: 'qa-ticket-priority',
    category: 'Support',
    questions: [
      'What priority for my ticket',
      'Ticket priority levels',
      'When to use critical',
      'Priority guidelines'
    ],
    answer: `**Ticket Priority Guidelines:**\n\n🔴 **Critical (P1)**\n• System down affecting multiple users\n• Security breach/incident\n• Cannot perform job functions\n• *Response: 1 hour*\n\n🟠 **High (P2)**\n• Major impact, no workaround\n• Single user completely blocked\n• Important deadline at risk\n• *Response: 4 hours*\n\n🟡 **Medium (P3)**\n• Moderate impact\n• Workaround available\n• Doesn't stop work completely\n• *Response: 1 business day*\n\n🟢 **Low (P4)**\n• Minor issue\n• Questions/How-tos\n• Equipment requests\n• *Response: 3 business days*\n\n⚠️ **Note:** Incorrectly marking tickets as Critical when they're not may result in deprioritization. Be accurate!`,
    followUpQuestions: ['Create a critical ticket', 'What counts as critical?'],
    relatedQAs: ['qa-create-ticket', 'qa-escalate-ticket']
  },
  {
    id: 'qa-escalate-ticket',
    category: 'Support',
    questions: [
      'Escalate my ticket',
      'Ticket taking too long',
      'Need faster response',
      'Speak to manager',
      'Complaint about support'
    ],
    answer: `**Escalating a Ticket:**\n\n⏰ **Before Escalating:**\n• Has SLA time passed?\n• Did you add comments requesting update?\n• Did you try calling IT hotline?\n\n📞 **Escalation Path:**\n\n**Level 1: Add Urgency**\n• Comment on ticket explaining urgency\n• Call IT hotline: ext 4357\n\n**Level 2: Request Escalation**\n• Ask in ticket to escalate\n• Email: it-support@company.com\n• Reference ticket number\n\n**Level 3: Management**\n• Contact IT Service Manager\n• Email: it-manager@company.com\n• CC your manager if needed\n\n📝 **When Escalating, Include:**\n• Ticket number\n• How long you've waited\n• Business impact\n• What you've already tried\n\n✅ **Valid Escalation Reasons:**\n• SLA breached\n• Issue critical to business\n• No response despite multiple attempts`,
    followUpQuestions: ['What\'s the IT manager\'s contact?', 'SLA times'],
    relatedQAs: ['qa-ticket-status', 'qa-ticket-priority']
  },
  
  // Security
  {
    id: 'qa-security-concern',
    category: 'Security',
    questions: [
      'I think I was hacked',
      'Suspicious email',
      'Phishing email',
      'Malware virus',
      'Security incident'
    ],
    answer: `**🚨 Security Concern? Act Fast!**\n\n**If Actively Compromised:**\n1. **Disconnect** from network/WiFi\n2. **Don't** click anything else\n3. **Call** IT Security: ext 4357 (option 2)\n4. Submit **Critical** ticket\n\n**Suspicious Email:**\n1. **Don't** click any links\n2. **Don't** download attachments\n3. **Don't** reply\n4. Forward to: phishing@company.com\n5. Delete the email\n\n**Signs of Phishing:**\n• Urgent/threatening language\n• Requests for passwords\n• Suspicious sender address\n• Unexpected attachments\n• Links to unfamiliar sites\n\n**Password May Be Compromised:**\n1. Change password immediately\n2. Enable MFA if not active\n3. Report to IT Security\n\n📋 **Report All Incidents**\n• Even if unsure, report it\n• IT Security would rather investigate than miss something`,
    followUpQuestions: ['How to report phishing', 'Change my password now'],
    relatedQAs: ['qa-password-reset', 'qa-mfa-setup']
  }
];

// ==========================================
// RAG (Retrieval-Augmented Generation) System
// ==========================================

export interface RAGContext {
  tickets: Ticket[];
  userQuery: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface RAGResult {
  relevantQAs: PredefinedQA[];
  relevantKB: KnowledgeArticle[];
  ticketContext?: {
    matchedTicket?: Ticket;
    relatedTickets?: Ticket[];
    summary?: TicketSummary;
    staffStats?: StaffStat[];
  };
  confidence: number;
}

/**
 * Calculate similarity score between query and Q&A
 */
function calculateQASimilarity(query: string, qa: PredefinedQA): number {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 2);
  
  let maxScore = 0;
  
  for (const question of qa.questions) {
    const questionLower = question.toLowerCase();
    let score = 0;
    
    // Exact match
    if (queryLower === questionLower) {
      return 1.0;
    }
    
    // Contains full question
    if (queryLower.includes(questionLower) || questionLower.includes(queryLower)) {
      score += 0.7;
    }
    
    // Word matching
    const questionWords = questionLower.split(/\s+/).filter((w: string) => w.length > 2);
    let matchedWords = 0;
    
    for (const word of queryWords) {
      if (questionWords.some((qw: string) => qw.includes(word) || word.includes(qw))) {
        matchedWords++;
      }
    }
    
    if (queryWords.length > 0) {
      score += (matchedWords / queryWords.length) * 0.5;
    }
    
    // Category keyword matching
    const categoryLower = qa.category.toLowerCase();
    if (queryLower.includes(categoryLower)) {
      score += 0.2;
    }
    
    maxScore = Math.max(maxScore, score);
  }
  
  return Math.min(maxScore, 1.0);
}

/**
 * RAG: Retrieve relevant context for the query
 */
export function retrieveContext(context: RAGContext): RAGResult {
  const { tickets, userQuery } = context;
  const queryLower = userQuery.toLowerCase();
  
  // Find relevant predefined Q&As
  const scoredQAs = PREDEFINED_QA_DATABASE.map((qa: PredefinedQA) => ({
    qa,
    score: calculateQASimilarity(userQuery, qa)
  }))
    .filter(({ score }) => score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  
  const relevantQAs = scoredQAs.map(({ qa }) => qa);
  const qaConfidence = scoredQAs.length > 0 ? scoredQAs[0].score : 0;
  
  // Find relevant knowledge base articles
  const relevantKB = searchKnowledgeBase(userQuery);
  const kbConfidence = relevantKB.length > 0 ? relevantKB[0].relevanceScore / 10 : 0;
  
  // Extract ticket context
  const ticketContext: RAGResult['ticketContext'] = {};
  
  // Check for ticket ID in query
  const ticketIdMatch = queryLower.match(/[a-z]{2,3}-\d{8}-\d{6}/i) || 
                        queryLower.match(/[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}/i);
  
  if (ticketIdMatch) {
    const matchedTicket = tickets.find((t: Ticket) => 
      t.ticketNumber?.toLowerCase() === ticketIdMatch[0].toLowerCase() ||
      t.id.toLowerCase().includes(ticketIdMatch[0].toLowerCase())
    );
    if (matchedTicket) {
      ticketContext.matchedTicket = matchedTicket;
    }
  }
  
  // Get ticket summary if asking about stats
  if (queryLower.includes('summary') || queryLower.includes('stats') || 
      queryLower.includes('overview') || queryLower.includes('how many')) {
    ticketContext.summary = calculateSummary(tickets);
  }
  
  // Get staff stats if asking about workload
  if (queryLower.includes('workload') || queryLower.includes('staff') ||
      queryLower.includes('assigned') || queryLower.includes('who has')) {
    ticketContext.staffStats = calculateStaffStats(tickets);
  }
  
  // Get related tickets
  if (queryLower.includes('critical') || queryLower.includes('urgent')) {
    ticketContext.relatedTickets = tickets
      .filter((t: Ticket) => t.priorityKey === 'PriorityKey3')
      .slice(0, 5);
  } else if (queryLower.includes('overdue') || queryLower.includes('sla')) {
    ticketContext.relatedTickets = tickets
      .filter((t: Ticket) => isTicketOverdue(t))
      .slice(0, 5);
  } else if (queryLower.includes('open') || queryLower.includes('my ticket')) {
    ticketContext.relatedTickets = tickets
      .filter((t: Ticket) => t.statusKey === 'StatusKey0' || t.statusKey === 'StatusKey1')
      .slice(0, 5);
  }
  
  // Calculate overall confidence
  const confidence = Math.max(qaConfidence, kbConfidence, ticketContext.matchedTicket ? 0.9 : 0);
  
  return {
    relevantQAs,
    relevantKB,
    ticketContext,
    confidence
  };
}

// ==========================================
// Copilot API Integration
// ==========================================

export interface CopilotRequest {
  query: string;
  context: RAGContext;
  ragResult: RAGResult;
}

export interface CopilotResponse {
  message: string;
  sourceType: 'predefined_qa' | 'knowledge_base' | 'ticket_data' | 'generated';
  sourceId?: string;
  confidence: number;
  suggestedActions: string[];
  followUpQuestions: string[];
  data?: {
    tickets?: Ticket[];
    ticket?: Ticket;
    summary?: TicketSummary;
    staffStats?: StaffStat[];
  };
}

/**
 * Process query using Copilot API with RAG
 * In production, this would call Azure OpenAI API
 */
export async function processCopilotQuery(request: CopilotRequest): Promise<CopilotResponse> {
  const { query, ragResult } = request;
  const queryLower = query.toLowerCase();
  
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
  
  // Priority 1: Check for exact Q&A match
  if (ragResult.relevantQAs.length > 0) {
    const bestQA = ragResult.relevantQAs[0];
    const similarity = calculateQASimilarity(query, bestQA);
    
    if (similarity > 0.5) {
      return {
        message: bestQA.answer,
        sourceType: 'predefined_qa',
        sourceId: bestQA.id,
        confidence: similarity,
        suggestedActions: bestQA.followUpQuestions?.slice(0, 2) || [],
        followUpQuestions: bestQA.relatedQAs?.map((id: string) => 
          PREDEFINED_QA_DATABASE.find((q: PredefinedQA) => q.id === id)?.questions[0]
        ).filter(Boolean) as string[] || []
      };
    }
  }
  
  // Priority 2: Ticket-specific queries
  if (ragResult.ticketContext?.matchedTicket) {
    const ticket = ragResult.ticketContext.matchedTicket;
    const status = STATUS_CONFIG[ticket.statusKey].label;
    const priority = PRIORITY_CONFIG[ticket.priorityKey].label;
    const isOverdue = isTicketOverdue(ticket);
    
    return {
      message: `**Ticket Details: ${ticket.ticketNumber}**\n\n` +
        `📋 **${ticket.title}**\n\n` +
        `• **Status:** ${status}\n` +
        `• **Priority:** ${priority}\n` +
        `• **Category:** ${ticket.mainCategory || 'General'}\n` +
        `• **Assigned to:** ${ticket.assignedTo || 'Unassigned'}\n` +
        `• **Created:** ${new Date(ticket.createdDate).toLocaleDateString()}\n` +
        (isOverdue ? '\n⚠️ **This ticket has exceeded its SLA target.**\n' : '') +
        `\nClick the ticket card below for full details.`,
      sourceType: 'ticket_data',
      sourceId: ticket.id,
      confidence: 0.95,
      suggestedActions: ['View full details', 'Check another ticket', 'Create new ticket'],
      followUpQuestions: [],
      data: { ticket }
    };
  }
  
  // Priority 3: Ticket list queries
  if (ragResult.ticketContext?.relatedTickets && ragResult.ticketContext.relatedTickets.length > 0) {
    const tickets = ragResult.ticketContext.relatedTickets;
    let filterType = 'matching';
    
    if (queryLower.includes('critical') || queryLower.includes('urgent')) {
      filterType = 'critical/urgent';
    } else if (queryLower.includes('overdue')) {
      filterType = 'overdue';
    } else if (queryLower.includes('open')) {
      filterType = 'open';
    }
    
    return {
      message: `Found **${tickets.length} ${filterType}** ticket${tickets.length !== 1 ? 's' : ''}:`,
      sourceType: 'ticket_data',
      confidence: 0.9,
      suggestedActions: ['View all tickets', 'Create new ticket'],
      followUpQuestions: ['Show ticket details', 'Filter by another criteria'],
      data: { tickets }
    };
  }
  
  // Priority 4: Summary/stats queries
  if (ragResult.ticketContext?.summary) {
    const s = ragResult.ticketContext.summary;
    return {
      message: `📊 **Ticket Summary**\n\n` +
        `• **Total:** ${s.total} tickets\n` +
        `• **Open:** ${s.open}\n` +
        `• **In Progress:** ${s.inProgress}\n` +
        `• **Resolved:** ${s.resolved}\n` +
        `• **Closed:** ${s.closed}\n\n` +
        `⚠️ **Needs Attention:**\n` +
        `• Critical: ${s.critical}\n` +
        `• Overdue: ${s.overdue}`,
      sourceType: 'ticket_data',
      confidence: 0.9,
      suggestedActions: ['Show critical tickets', 'Show overdue tickets', 'View dashboard'],
      followUpQuestions: [],
      data: { summary: s }
    };
  }
  
  // Priority 5: Staff workload
  if (ragResult.ticketContext?.staffStats) {
    const stats = ragResult.ticketContext.staffStats;
    const statsText = stats.slice(0, 5)
      .map((s: StaffStat) => `• **${s.name}:** ${s.totalAssigned} (${s.openTickets} open, ${s.criticalTickets} critical)`)
      .join('\n');
    
    return {
      message: `👥 **Staff Workload**\n\n${statsText}`,
      sourceType: 'ticket_data',
      confidence: 0.9,
      suggestedActions: ['View assignment workflow', 'Balance workload'],
      followUpQuestions: [],
      data: { staffStats: stats }
    };
  }
  
  // Priority 6: Knowledge base
  if (ragResult.relevantKB.length > 0) {
    const article = ragResult.relevantKB[0];
    return {
      message: `I found a relevant article that might help:\n\n` +
        `**${article.title}**\n\n${article.solution}`,
      sourceType: 'knowledge_base',
      sourceId: article.id,
      confidence: Math.min(article.relevanceScore / 10, 0.8),
      suggestedActions: ['Create a ticket if this doesn\'t help', 'Search for something else'],
      followUpQuestions: ['Did this solve your problem?']
    };
  }
  
  // Default: Helpful fallback
  return {
    message: `I'm not sure about that specific question, but I can help you with:\n\n` +
      `🎫 **Tickets** - Create, track, or check status\n` +
      `🔧 **Troubleshooting** - Password, network, email, software issues\n` +
      `📊 **Reports** - Ticket summaries and staff workload\n` +
      `❓ **How-to** - Using this help desk system\n\n` +
      `Try asking something like:\n` +
      `• "How do I reset my password?"\n` +
      `• "Show my open tickets"\n` +
      `• "Create a new ticket"\n` +
      `• "Check ticket RIL-20260522-143052"`,
    sourceType: 'generated',
    confidence: 0.3,
    suggestedActions: ['Create a ticket', 'Search knowledge base', 'Show my tickets'],
    followUpQuestions: []
  };
}

/**
 * Main entry point for Copilot-powered chat
 */
export async function processWithCopilot(context: RAGContext): Promise<CopilotResponse> {
  // Step 1: Retrieve relevant context (RAG)
  const ragResult = retrieveContext(context);
  
  // Step 2: Process with Copilot API
  const response = await processCopilotQuery({
    query: context.userQuery,
    context,
    ragResult
  });
  
  return response;
}

// Export predefined Q&A categories for quick access
export function getQACategories(): string[] {
  return [...new Set(PREDEFINED_QA_DATABASE.map((qa: PredefinedQA) => qa.category))];
}

export function getQAsByCategory(category: string): PredefinedQA[] {
  return PREDEFINED_QA_DATABASE.filter((qa: PredefinedQA) => qa.category === category);
}

export function searchQAs(query: string): PredefinedQA[] {
  return PREDEFINED_QA_DATABASE
    .map((qa: PredefinedQA) => ({ qa, score: calculateQASimilarity(query, qa) }))
    .filter(({ score }) => score > 0.2)
    .sort((a, b) => b.score - a.score)
    .map(({ qa }) => qa)
    .slice(0, 5);
}
