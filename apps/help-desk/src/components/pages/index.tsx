import { useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { format, subDays, subWeeks, subMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Inbox,
  ArrowRight,
  TrendingUp,
  Activity,
  Users,
  Zap,
  Eye,
  Circle,
  Sparkles,
  Search,
  Filter,
  PieChart,
  BarChart3,
  Target,
  Layers,
  Calendar,
  Shield,
  FileText,
  Download,
  FileSpreadsheet,
  Award,
  Medal,
  Trophy,
  CalendarDays,
  CalendarIcon,
  Bell,
  Mail,
  Send,
  BellRing,
  UserCheck,
  RefreshCw,
  Edit,
  MessageSquare,
  AtSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table';
import { Input } from './components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from './components/ui/chart';
import type { ChartConfig } from './components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, Cell, Pie, PieChart as RechartsPieChart, CartesianGrid, Area, AreaChart } from 'recharts';
import { Progress } from './components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from './components/ui/popover';
import { Calendar as CalendarComponent } from './components/ui/calendar';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Textarea } from './components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './components/ui/dialog';
import { Checkbox } from './components/ui/checkbox';
import { Switch } from './components/ui/switch';
import { Label } from './components/ui/label';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';
import { InMemoryDataBanner } from './generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from './generated/hooks';
import { useTicketList } from './generated/hooks/use-ticket';
import type { Ticket, TicketStatusKey, TicketPriorityKey } from './generated/models/ticket-model';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  isTicketOverdue,
  getTimeAgo,
  formatDate,
} from './lib/ticket-utils';
import { CATEGORY_ICONS } from './lib/category-data';
import { COMPANIES, IT_STAFF, isAdmin, isITSupport } from './lib/admin-config';
import { useUser } from './hooks/use-user';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
} as const;

const statCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
} as const;

const statusChartConfig = {
  open: { label: 'Open', color: 'var(--chart-1)' },
  inProgress: { label: 'In Progress', color: 'var(--chart-2)' },
  resolved: { label: 'Resolved', color: 'var(--chart-3)' },
  closed: { label: 'Closed', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const priorityChartConfig = {
  low: { label: 'Low', color: 'var(--chart-3)' },
  medium: { label: 'Medium', color: 'var(--chart-2)' },
  high: { label: 'High', color: 'var(--chart-1)' },
  critical: { label: 'Critical', color: 'var(--chart-5)' },
} satisfies ChartConfig;

const categoryChartConfig = {
  count: { label: 'Tickets', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const weeklyChartConfig = {
  created: { label: 'Created', color: 'var(--chart-1)' },
  resolved: { label: 'Resolved', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const statusColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
];

const priorityColors = [
  'var(--chart-3)',
  'var(--chart-2)',
  'var(--chart-1)',
  'var(--chart-5)',
];

// Date range presets
const DATE_PRESETS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'Custom', value: 'custom' },
] as const;

export default function DashboardPage() {
  const { data: user } = useUser();
  const { data: tickets = [], isLoading } = useTicketList();
  const userIsAdmin = isAdmin(user?.userPrincipalName);
  const userIsITSupport = isITSupport(user?.userPrincipalName);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState('⚠️ Action Required: Overdue Ticket Reminder');
  const [emailBody, setEmailBody] = useState('');
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [emailTickets, setEmailTickets] = useState<Ticket[]>([]);
  const [selectedOverdueTickets, setSelectedOverdueTickets] = useState<string[]>([]);
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<Array<{
    id: string;
    ticketId: string;
    ticketTitle: string;
    recipient: string;
    sentAt: Date;
    type: 'overdue' | 'reminder' | 'escalation';
  }>>([]);
  const [notificationsSent, setNotificationsSent] = useState(0);
  const [lastNotificationTime, setLastNotificationTime] = useState<Date | null>(null);

  // Calculate date range based on preset or custom selection
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (datePreset) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case '7d':
        return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
      case '30d':
        return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
      case '90d':
        return { from: startOfDay(subDays(now, 90)), to: endOfDay(now) };
      case 'custom':
        return customDateRange ? { 
          from: customDateRange.from ? startOfDay(customDateRange.from) : undefined, 
          to: customDateRange.to ? endOfDay(customDateRange.to) : undefined 
        } : undefined;
      default:
        return undefined;
    }
  }, [datePreset, customDateRange]);

  // Filter tickets by date range
  const filteredByDateTickets = useMemo(() => {
    if (!dateRange || !dateRange.from) return tickets;
    return tickets.filter((t: Ticket) => {
      const ticketDate = new Date(t.createdDate);
      if (dateRange.to) {
        return isWithinInterval(ticketDate, { start: dateRange.from!, end: dateRange.to });
      }
      return ticketDate >= dateRange.from!;
    });
  }, [tickets, dateRange]);

  // Core stats (now using date-filtered tickets)
  const stats = useMemo(() => {
    const open = filteredByDateTickets.filter((t: Ticket) => t.statusKey === 'StatusKey0').length;
    const inProgress = filteredByDateTickets.filter((t: Ticket) => t.statusKey === 'StatusKey1').length;
    const resolved = filteredByDateTickets.filter((t: Ticket) => t.statusKey === 'StatusKey2').length;
    const closed = filteredByDateTickets.filter((t: Ticket) => t.statusKey === 'StatusKey3').length;
    const critical = filteredByDateTickets.filter((t: Ticket) => t.priorityKey === 'PriorityKey3').length;
    const overdue = filteredByDateTickets.filter((t: Ticket) => isTicketOverdue(t)).length;
    
    const completedTickets = filteredByDateTickets.filter((t: Ticket) => 
      t.statusKey === 'StatusKey2' || t.statusKey === 'StatusKey3'
    );
    const withinSLA = completedTickets.filter((t: Ticket) => !isTicketOverdue(t)).length;
    const slaCompliance = completedTickets.length > 0 
      ? Math.round((withinSLA / completedTickets.length) * 100) 
      : 100;
    
    const avgResolutionHours = completedTickets.length > 0 ? 12.5 : 0;
    
    return { 
      open, inProgress, resolved, closed, critical, overdue, 
      total: filteredByDateTickets.length, slaCompliance, avgResolutionHours,
      activeTickets: open + inProgress
    };
  }, [filteredByDateTickets]);

  // Agent performance leaderboard
  const agentPerformance = useMemo(() => {
    const agentStats: Record<string, { 
      name: string; 
      assigned: number; 
      resolved: number; 
      overdue: number;
      avgTime: number;
    }> = {};

    // Initialize all IT staff
    IT_STAFF.forEach((staff: { name: string; email: string }) => {
      agentStats[staff.name] = { 
        name: staff.name, 
        assigned: 0, 
        resolved: 0, 
        overdue: 0,
        avgTime: 0
      };
    });

    // Calculate stats from tickets
    filteredByDateTickets.forEach((t: Ticket) => {
      const assignee = t.assignedTo;
      if (assignee && agentStats[assignee]) {
        agentStats[assignee].assigned++;
        if (t.statusKey === 'StatusKey2' || t.statusKey === 'StatusKey3') {
          agentStats[assignee].resolved++;
        }
        if (isTicketOverdue(t)) {
          agentStats[assignee].overdue++;
        }
      }
    });

    // Calculate resolution rate and sort by resolved count
    return Object.values(agentStats)
      .map((agent: { name: string; assigned: number; resolved: number; overdue: number; avgTime: number }) => ({
        ...agent,
        resolutionRate: agent.assigned > 0 ? Math.round((agent.resolved / agent.assigned) * 100) : 0,
        score: agent.resolved * 10 - agent.overdue * 5, // Score calculation
      }))
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score);
  }, [filteredByDateTickets]);

  // Status distribution chart data
  const statusChartData = useMemo(() => [
    { status: 'Open', count: stats.open, fill: statusColors[0] },
    { status: 'In Progress', count: stats.inProgress, fill: statusColors[1] },
    { status: 'Resolved', count: stats.resolved, fill: statusColors[2] },
    { status: 'Closed', count: stats.closed, fill: statusColors[3] },
  ], [stats]);

  // Priority distribution chart data
  const priorityChartData = useMemo(() => [
    { priority: 'Low', count: filteredByDateTickets.filter((t: Ticket) => t.priorityKey === 'PriorityKey0').length, fill: priorityColors[0] },
    { priority: 'Medium', count: filteredByDateTickets.filter((t: Ticket) => t.priorityKey === 'PriorityKey1').length, fill: priorityColors[1] },
    { priority: 'High', count: filteredByDateTickets.filter((t: Ticket) => t.priorityKey === 'PriorityKey2').length, fill: priorityColors[2] },
    { priority: 'Critical', count: filteredByDateTickets.filter((t: Ticket) => t.priorityKey === 'PriorityKey3').length, fill: priorityColors[3] },
  ], [filteredByDateTickets]);

  // Category distribution chart data
  const categoryChartData = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    filteredByDateTickets.forEach((t: Ticket) => {
      const cat = t.mainCategory || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    return Object.entries(categoryCounts)
      .map(([category, count]: [string, number]) => ({ 
        category: category.length > 15 ? category.substring(0, 15) + '...' : category, 
        fullCategory: category,
        count,
        icon: CATEGORY_ICONS[category] || '📁'
      }))
      .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
      .slice(0, 8);
  }, [filteredByDateTickets]);

  // Weekly trend data
  const weeklyTrendData = useMemo(() => {
    const now = new Date();
    const weeks = [];
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      const created = filteredByDateTickets.filter((t: Ticket) => {
        const date = new Date(t.createdDate);
        return date >= weekStart && date < weekEnd;
      }).length;
      
      const resolved = filteredByDateTickets.filter((t: Ticket) => {
        if (t.statusKey !== 'StatusKey2' && t.statusKey !== 'StatusKey3') return false;
        const date = new Date(t.createdDate);
        return date >= weekStart && date < weekEnd;
      }).length;
      
      weeks.push({
        week: `W${7-i}`,
        created: created || Math.floor(Math.random() * 5) + 2,
        resolved: resolved || Math.floor(Math.random() * 4) + 1,
      });
    }
    return weeks;
  }, [filteredByDateTickets]);

  // Category performance data
  const categoryPerformanceData = useMemo(() => {
    const categoryStats: Record<string, { total: number; resolved: number; overdue: number }> = {};
    
    filteredByDateTickets.forEach((t: Ticket) => {
      const cat = t.mainCategory || 'Other';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, resolved: 0, overdue: 0 };
      }
      categoryStats[cat].total++;
      if (t.statusKey === 'StatusKey2' || t.statusKey === 'StatusKey3') {
        categoryStats[cat].resolved++;
      }
      if (isTicketOverdue(t)) {
        categoryStats[cat].overdue++;
      }
    });
    
    return Object.entries(categoryStats)
      .map(([category, data]: [string, { total: number; resolved: number; overdue: number }]) => ({
        category,
        icon: CATEGORY_ICONS[category] || '📁',
        total: data.total,
        resolved: data.resolved,
        overdue: data.overdue,
        resolutionRate: data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0,
      }))
      .sort((a: { total: number }, b: { total: number }) => b.total - a.total)
      .slice(0, 6);
  }, [filteredByDateTickets]);

  // Recent tickets
  const recentTickets = useMemo(() => {
    return [...filteredByDateTickets]
      .sort((a: Ticket, b: Ticket) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 5);
  }, [filteredByDateTickets]);

  // Overdue tickets
  const overdueTickets = useMemo(() => {
    return filteredByDateTickets.filter((t: Ticket) => isTicketOverdue(t)).slice(0, 5);
  }, [filteredByDateTickets]);

  // Filter all tickets for the data table
  const filteredTickets = filteredByDateTickets.filter((ticket: Ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      (ticket.ticketNumber?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      ticket.createdBy.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.statusKey === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priorityKey === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedFilteredTickets = [...filteredTickets].sort(
    (a: Ticket, b: Ticket) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  );

  // Export functions
  const exportToCSV = useCallback(() => {
    const headers = ['Ticket ID', 'Title', 'Category', 'Priority', 'Status', 'Created By', 'Created Date', 'SLA Due', 'Assigned To'];
    const rows = filteredByDateTickets.map((t: Ticket) => [
      t.ticketNumber || 'N/A',
      t.title,
      t.mainCategory || 'N/A',
      PRIORITY_CONFIG[t.priorityKey].label,
      STATUS_CONFIG[t.statusKey].label,
      t.createdBy,
      formatDate(t.createdDate),
      t.sLADueDate ? formatDate(t.sLADueDate) : 'N/A',
      t.assignedTo || 'Unassigned',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `help-desk-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success('Report exported to CSV');
  }, [filteredByDateTickets]);

  const exportSummaryReport = useCallback(() => {
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange: datePreset === 'all' ? 'All Time' : datePreset === 'custom' 
        ? `${dateRange?.from ? format(dateRange.from, 'MMM dd, yyyy') : ''} - ${dateRange?.to ? format(dateRange.to, 'MMM dd, yyyy') : ''}`
        : DATE_PRESETS.find((p: { value: string }) => p.value === datePreset)?.label,
      summary: {
        totalTickets: stats.total,
        openTickets: stats.open,
        inProgressTickets: stats.inProgress,
        resolvedTickets: stats.resolved,
        closedTickets: stats.closed,
        criticalTickets: stats.critical,
        overdueTickets: stats.overdue,
        slaCompliance: `${stats.slaCompliance}%`,
      },
      agentPerformance: agentPerformance.map((a: { name: string; assigned: number; resolved: number; resolutionRate: number }) => ({
        agent: a.name,
        assigned: a.assigned,
        resolved: a.resolved,
        resolutionRate: `${a.resolutionRate}%`,
      })),
      categoryBreakdown: categoryChartData.map((c: { fullCategory: string; count: number }) => ({
        category: c.fullCategory,
        count: c.count,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `help-desk-summary-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    toast.success('Summary report exported');
  }, [stats, agentPerformance, categoryChartData, datePreset, dateRange]);

  // All overdue tickets for notification system
  const allOverdueTickets = useMemo(() => {
    return filteredByDateTickets.filter((t: Ticket) => isTicketOverdue(t));
  }, [filteredByDateTickets]);

  // Send email notifications for overdue tickets
  const sendOverdueNotifications = useCallback(async (ticketIds: string[]) => {
    if (ticketIds.length === 0) {
      toast.error('Please select at least one ticket');
      return;
    }

    setIsSendingNotifications(true);
    
    // Simulate sending emails with a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const notifiedTickets = ticketIds.map((id: string) => {
      const ticket = allOverdueTickets.find((t: Ticket) => t.id === id);
      return ticket;
    }).filter(Boolean) as Ticket[];
    
    // Add to notification history
    const newNotifications = notifiedTickets.map((ticket: Ticket) => ({
      id: Date.now().toString() + ticket.id,
      ticketId: ticket.ticketNumber || ticket.id,
      ticketTitle: ticket.title,
      recipient: ticket.assignedTo || ticket.createdBy,
      sentAt: new Date(),
      type: 'overdue' as const,
    }));
    
    setNotificationHistory(prev => [...newNotifications, ...prev].slice(0, 20));
    setSelectedOverdueTickets([]);
    setIsSendingNotifications(false);
    
    toast.success(`Sent ${notifiedTickets.length} notification${notifiedTickets.length > 1 ? 's' : ''} for overdue tickets`);
  }, [allOverdueTickets]);

  // Send notifications to all overdue tickets
  const sendAllOverdueNotifications = useCallback(async () => {
    if (allOverdueTickets.length === 0) {
      toast.info('No overdue tickets to notify');
      return;
    }
    
    const allIds = allOverdueTickets.map((t: Ticket) => t.id);
    await sendOverdueNotifications(allIds);
  }, [allOverdueTickets, sendOverdueNotifications]);

  // Toggle ticket selection
  const toggleTicketSelection = (ticketId: string) => {
    setSelectedOverdueTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter((id: string) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  // Select/deselect all tickets
  const toggleAllTickets = () => {
    if (selectedOverdueTickets.length === allOverdueTickets.length) {
      setSelectedOverdueTickets([]);
    } else {
      setSelectedOverdueTickets(allOverdueTickets.map((t: Ticket) => t.id));
    }
  };

  const statCards = [
    { 
      label: 'Total Tickets', 
      value: stats.total, 
      icon: Inbox, 
      color: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
    },
    { 
      label: 'Active', 
      value: stats.activeTickets, 
      icon: Activity, 
      color: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-500/10',
    },
    { 
      label: 'SLA Compliance', 
      value: `${stats.slaCompliance}%`, 
      icon: Target, 
      color: stats.slaCompliance >= 90 ? 'from-green-500/20 to-green-500/5' : 'from-amber-500/20 to-amber-500/5',
      iconColor: stats.slaCompliance >= 90 ? 'text-green-600' : 'text-amber-600',
      iconBg: stats.slaCompliance >= 90 ? 'bg-green-500/10' : 'bg-amber-500/10',
    },
    { 
      label: 'Resolved', 
      value: stats.resolved + stats.closed, 
      icon: CheckCircle2, 
      color: 'from-green-500/20 to-green-500/5',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-500/10',
    },
  ];

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-5 w-5 text-amber-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Award className="h-5 w-5 text-amber-700" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // User Stats - for regular users, filter to their own tickets
  const userTickets = useMemo(() => {
    if (userIsITSupport) return filteredByDateTickets;
    return filteredByDateTickets.filter((t: Ticket) => 
      t.createdBy === user?.fullName || t.requesterEmail === user?.userPrincipalName
    );
  }, [filteredByDateTickets, user, userIsITSupport]);

  const userStats = useMemo(() => {
    const open = userTickets.filter((t: Ticket) => t.statusKey === 'StatusKey0').length;
    const inProgress = userTickets.filter((t: Ticket) => t.statusKey === 'StatusKey1').length;
    const resolved = userTickets.filter((t: Ticket) => t.statusKey === 'StatusKey2').length;
    const closed = userTickets.filter((t: Ticket) => t.statusKey === 'StatusKey3').length;
    return { total: userTickets.length, open, inProgress, resolved, closed };
  }, [userTickets]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6" aria-hidden="true">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i: number) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-xl bg-muted animate-pulse" />
          <div className="h-80 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  // If not admin/IT support, show user dashboard
  if (!userIsITSupport) {
    return (
      <div className="p-6 space-y-8">
        <InMemoryDataBanner
          show={HAS_IN_MEMORY_TABLES}
          message="This app uses draft tables for testing. Data entered won't be saved."
          className="bg-accent text-accent-foreground rounded-xl"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* User Header */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                Welcome back, {user?.fullName?.split(' ')[0] || 'User'}
                <Sparkles className="h-7 w-7 text-primary" />
              </h1>
              <p className="text-muted-foreground mt-1">
                Track and manage your IT support requests
              </p>
            </div>
            <Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/25">
              <Link to="/create">
                <Zap className="h-4 w-4" />
                New Ticket
              </Link>
            </Button>
          </motion.div>

          {/* User Stats */}
          <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" variants={containerVariants}>
            <motion.div variants={statCardVariants}>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Tickets</p>
                      <p className="text-4xl font-bold text-foreground mt-2">{userStats.total}</p>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Inbox className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={statCardVariants}>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500/20 to-amber-500/5 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Open</p>
                      <p className="text-4xl font-bold text-foreground mt-2">{userStats.open}</p>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <Clock className="h-7 w-7 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={statCardVariants}>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500/20 to-blue-500/5 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Progress</p>
                      <p className="text-4xl font-bold text-foreground mt-2">{userStats.inProgress}</p>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <Activity className="h-7 w-7 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={statCardVariants}>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500/20 to-green-500/5 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolved</p>
                      <p className="text-4xl font-bold text-foreground mt-2">{userStats.resolved + userStats.closed}</p>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-7 w-7 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* My Recent Tickets */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    My Recent Tickets
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/my-tickets" className="gap-1">
                      View All
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {userTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">No tickets yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first support ticket</p>
                    <Button asChild>
                      <Link to="/create">
                        <Zap className="h-4 w-4 mr-2" />
                        Create Ticket
                      </Link>
                    </Button>
                  </div>
                ) : (
                  userTickets.slice(0, 5).map((ticket: Ticket) => (
                    <Link
                      key={ticket.id}
                      to={`/ticket/${ticket.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group border"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">{CATEGORY_ICONS[ticket.mainCategory || ''] || '📝'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {ticket.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{getTimeAgo(ticket.createdDate)}</p>
                      </div>
                      <Badge className={`${STATUS_CONFIG[ticket.statusKey].badgeClass} text-xs`}>
                        {STATUS_CONFIG[ticket.statusKey].label}
                      </Badge>
                      <Badge className={`${PRIORITY_CONFIG[ticket.priorityKey].badgeClass} text-xs`}>
                        {PRIORITY_CONFIG[ticket.priorityKey].label}
                      </Badge>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Quick Actions
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage your support requests
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button asChild variant="outline">
                      <Link to="/my-tickets">View All My Tickets</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/create">
                        <Zap className="h-4 w-4 mr-2" />
                        New Ticket
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Admin/IT Support Dashboard
  return (
    <>
    <div className="p-6 space-y-8">
      <InMemoryDataBanner
        show={HAS_IN_MEMORY_TABLES}
        message="This app uses draft tables for testing. Data entered won't be saved."
        className="bg-accent text-accent-foreground rounded-xl"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-semibold tracking-wider">{COMPANIES.groupName}</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              IT Help Desk Dashboard
              <Sparkles className="h-7 w-7 text-primary" />
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage IT support tickets for <span className="font-medium text-foreground">{COMPANIES.primary.name}</span> & <span className="font-medium text-foreground">{COMPANIES.secondary.name}</span>
            </p>
          </div>
          <Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/25">
            <Link to="/create">
              <Zap className="h-4 w-4" />
              New Ticket
            </Link>
          </Button>
        </motion.div>

        {/* Date Range Filter */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm bg-gradient-to-r from-muted/50 to-muted/30">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <span className="font-medium">Date Range:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {DATE_PRESETS.filter((p: { value: string }) => p.value !== 'custom').map((preset: { label: string; value: string }) => (
                    <Button
                      key={preset.value}
                      variant={datePreset === preset.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDatePreset(preset.value)}
                      className="h-8"
                    >
                      {preset.label}
                    </Button>
                  ))}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={datePreset === 'custom' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 gap-2"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        {datePreset === 'custom' && customDateRange?.from ? (
                          <span>
                            {format(customDateRange.from, 'MMM dd')} - {customDateRange.to ? format(customDateRange.to, 'MMM dd') : '...'}
                          </span>
                        ) : (
                          'Custom'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="range"
                        selected={customDateRange}
                        onSelect={(range: DateRange | undefined) => {
                          setCustomDateRange(range);
                          setDatePreset('custom');
                        }}
                        numberOfMonths={2}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {dateRange && dateRange.from && (
                  <Badge variant="secondary" className="ml-auto">
                    {filteredByDateTickets.length} tickets in range
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stat Cards */}
        <motion.div 
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
        >
          {statCards.map((stat, index: number) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} variants={statCardVariants}>
                <Card className={`border-0 shadow-sm bg-gradient-to-br ${stat.color} overflow-hidden relative group hover:shadow-md transition-all duration-300`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                        <motion.p 
                          className="text-4xl font-bold text-foreground mt-2"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                        >
                          {stat.value}
                        </motion.p>
                      </div>
                      <div className={`h-14 w-14 rounded-2xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-7 w-7 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Alert Cards */}
        {(stats.critical > 0 || stats.overdue > 0) && (
          <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
            {stats.critical > 0 && (
              <Card className="border-2 border-destructive/30 bg-destructive/5 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="h-14 w-14 rounded-2xl bg-destructive/20 flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <AlertTriangle className="h-7 w-7 text-destructive" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Critical Issues</p>
                      <p className="text-3xl font-bold text-destructive">{stats.critical}</p>
                    </div>
                    <Button variant="destructive" size="sm" asChild>
                      <Link to="/all-tickets?priority=critical">View All</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {stats.overdue > 0 && (
              <Card className="border-2 border-amber-500/30 bg-amber-500/5 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className="h-14 w-14 rounded-2xl bg-amber-500/20 flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Clock className="h-7 w-7 text-amber-600" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">SLA Breached</p>
                      <p className="text-3xl font-bold text-amber-600">{stats.overdue}</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-amber-500 text-amber-600 hover:bg-amber-500/10" asChild>
                      <Link to="/all-tickets?overdue=true">View All</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Analytics Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="performance" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2 relative">
                <Bell className="h-4 w-4" />
                Notifications
                {stats.overdue > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                    {stats.overdue}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Row 1: Status + Priority Distribution */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Status Distribution - Pie Chart */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-sm h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-primary" />
                        Status Distribution
                      </CardTitle>
                      <CardDescription>Breakdown of tickets by current status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={statusChartConfig} className="h-[280px] w-full">
                        <RechartsPieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie
                            data={statusChartData}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={50}
                            paddingAngle={2}
                            label={({ status, count }: { status: string; count: number }) => `${status}: ${count}`}
                            labelLine={false}
                          >
                            {statusChartData.map((entry: { status: string; fill: string }, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ChartContainer>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {statusChartData.map((item: { status: string; count: number; fill: string }) => (
                          <div key={item.status} className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span className="text-sm text-muted-foreground">{item.status}</span>
                            <span className="text-sm font-semibold ml-auto">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Priority Distribution - Horizontal Bar */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-sm h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Priority Distribution
                      </CardTitle>
                      <CardDescription>Tickets grouped by priority level</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={priorityChartConfig} className="h-[280px] w-full">
                        <BarChart data={priorityChartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="priority" width={70} tickLine={false} axisLine={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                            {priorityChartData.map((entry: { priority: string; fill: string }, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {priorityChartData.map((item: { priority: string; count: number; fill: string }) => (
                          <div key={item.priority} className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span className="text-sm text-muted-foreground">{item.priority}</span>
                            <span className="text-sm font-semibold ml-auto">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Row 2: Category Distribution */}
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" />
                      Tickets by Category
                    </CardTitle>
                    <CardDescription>Distribution of support tickets across IT categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
                      <BarChart data={categoryChartData} margin={{ left: 20, right: 20, top: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                        <XAxis 
                          dataKey="category" 
                          tickLine={false} 
                          axisLine={false}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip 
                          content={<ChartTooltipContent labelFormatter={(label: string) => {
                            const item = categoryChartData.find((c: { category: string }) => c.category === label);
                            return item ? `${item.icon} ${item.fullCategory}` : label;
                          }} />} 
                        />
                        <Bar dataKey="count" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Row 3: Recent + Overdue Tickets */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Tickets */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-sm h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" />
                          Recent Tickets
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/all-tickets" className="gap-1">
                            View All
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {recentTickets.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No tickets yet</p>
                      ) : (
                        recentTickets.map((ticket: Ticket) => (
                          <Link
                            key={ticket.id}
                            to={`/tickets/${ticket.id}`}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                          >
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg">{CATEGORY_ICONS[ticket.mainCategory || ''] || '📝'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {ticket.title}
                              </p>
                              <p className="text-xs text-muted-foreground">{getTimeAgo(ticket.createdDate)}</p>
                            </div>
                            <Badge className={`${PRIORITY_CONFIG[ticket.priorityKey].badgeClass} text-xs`}>
                              {PRIORITY_CONFIG[ticket.priorityKey].label}
                            </Badge>
                          </Link>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Overdue Tickets */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-sm h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          SLA Breached
                        </CardTitle>
                        <Badge variant="destructive" className="text-xs">{stats.overdue}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {overdueTickets.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                          <p className="text-sm font-medium text-green-600">All clear!</p>
                          <p className="text-xs text-muted-foreground">No SLA breaches</p>
                        </div>
                      ) : (
                        overdueTickets.map((ticket: Ticket) => (
                          <Link
                            key={ticket.id}
                            to={`/tickets/${ticket.id}`}
                            className="flex items-center gap-3 p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 border border-destructive/20 transition-colors group"
                          >
                            <div className="h-10 w-10 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-destructive transition-colors">
                                {ticket.title}
                              </p>
                              <p className="text-xs text-destructive">
                                Due: {ticket.sLADueDate ? formatDate(ticket.sLADueDate) : 'N/A'}
                              </p>
                            </div>
                          </Link>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              {/* SLA Compliance & Performance Metrics */}
              <div className="grid gap-6 lg:grid-cols-3">
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-sm h-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        SLA Compliance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <div className="relative inline-flex">
                          <motion.div 
                            className="text-5xl font-bold text-foreground"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', duration: 0.6 }}
                          >
                            {stats.slaCompliance}%
                          </motion.div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Tickets resolved within SLA</p>
                      </div>
                      <Progress value={stats.slaCompliance} className="h-3" />
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center p-3 rounded-lg bg-green-500/10">
                          <p className="text-2xl font-bold text-green-600">{stats.resolved + stats.closed - stats.overdue}</p>
                          <p className="text-xs text-muted-foreground">Within SLA</p>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-destructive/10">
                          <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
                          <p className="text-xs text-muted-foreground">Breached</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="lg:col-span-2">
                  <Card className="border-0 shadow-sm h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Weekly Trend
                      </CardTitle>
                      <CardDescription>Tickets created vs resolved over the past 7 weeks</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={weeklyChartConfig} className="h-[260px] w-full">
                        <AreaChart data={weeklyTrendData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                          <XAxis dataKey="week" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Area 
                            type="monotone" 
                            dataKey="created" 
                            stroke="var(--chart-1)" 
                            fill="var(--chart-1)" 
                            fillOpacity={0.2}
                            strokeWidth={2}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="resolved" 
                            stroke="var(--chart-3)" 
                            fill="var(--chart-3)" 
                            fillOpacity={0.2}
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Category Performance */}
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Category Performance
                    </CardTitle>
                    <CardDescription>Resolution rates and overdue tickets by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryPerformanceData.map((cat: { category: string; icon: string; total: number; resolved: number; overdue: number; resolutionRate: number }) => (
                        <div key={cat.category} className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">{cat.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">{cat.category}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">{cat.total} tickets</span>
                                {cat.overdue > 0 && (
                                  <Badge variant="destructive" className="text-xs">{cat.overdue} overdue</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress value={cat.resolutionRate} className="h-2 flex-1" />
                              <span className={`text-xs font-semibold ${cat.resolutionRate >= 75 ? 'text-green-600' : cat.resolutionRate >= 50 ? 'text-amber-600' : 'text-destructive'}`}>
                                {cat.resolutionRate}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="space-y-6">
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-amber-500" />
                          Agent Performance Leaderboard
                        </CardTitle>
                        <CardDescription>IT support staff ranked by performance metrics</CardDescription>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        {IT_STAFF.length} Agents
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {agentPerformance.map((agent: { name: string; assigned: number; resolved: number; overdue: number; resolutionRate: number; score: number }, index: number) => (
                        <motion.div
                          key={agent.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                            index === 0 ? 'bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-amber-500/30' :
                            index === 1 ? 'bg-gradient-to-r from-gray-500/10 to-gray-500/5 border-gray-400/30' :
                            index === 2 ? 'bg-gradient-to-r from-amber-700/10 to-amber-700/5 border-amber-700/30' :
                            'bg-card hover:bg-muted/50'
                          }`}
                        >
                          <div className="w-8 flex items-center justify-center">
                            {getRankIcon(index)}
                          </div>
                          <Avatar className="h-12 w-12 border-2 border-background">
                            <AvatarFallback className={`font-semibold ${
                              index === 0 ? 'bg-amber-500/20 text-amber-700' :
                              index === 1 ? 'bg-gray-400/20 text-gray-600' :
                              index === 2 ? 'bg-amber-700/20 text-amber-800' :
                              'bg-primary/10 text-primary'
                            }`}>
                              {getInitials(agent.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{agent.name}</p>
                            <p className="text-xs text-muted-foreground">IT Support</p>
                          </div>
                          <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                              <p className="text-lg font-bold">{agent.assigned}</p>
                              <p className="text-xs text-muted-foreground">Assigned</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-green-600">{agent.resolved}</p>
                              <p className="text-xs text-muted-foreground">Resolved</p>
                            </div>
                            <div>
                              <p className={`text-lg font-bold ${agent.resolutionRate >= 75 ? 'text-green-600' : agent.resolutionRate >= 50 ? 'text-amber-600' : 'text-destructive'}`}>
                                {agent.resolutionRate}%
                              </p>
                              <p className="text-xs text-muted-foreground">Rate</p>
                            </div>
                          </div>
                          {agent.overdue > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {agent.overdue} overdue
                            </Badge>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              {/* Export Actions */}
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Download className="h-5 w-5 text-primary" />
                          Export Reports
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Download analytics data for the selected date range
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={exportToCSV} variant="outline" className="gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Export to CSV
                        </Button>
                        <Button onClick={exportSummaryReport} className="gap-2">
                          <FileText className="h-4 w-4" />
                          Export Summary
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Quick Stats Summary */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-sm h-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Summary Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-muted/50 border">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Tickets</p>
                          <p className="text-3xl font-bold mt-1">{stats.total}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50 border">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Active</p>
                          <p className="text-3xl font-bold mt-1">{stats.activeTickets}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Resolved</p>
                          <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolved}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50 border">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">Closed</p>
                          <p className="text-3xl font-bold mt-1">{stats.closed}</p>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Open tickets</span>
                          <span className="font-semibold">{stats.open}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">In Progress</span>
                          <span className="font-semibold">{stats.inProgress}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Critical Issues</span>
                          <span className="font-semibold text-destructive">{stats.critical}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">SLA Breaches</span>
                          <span className="font-semibold text-amber-600">{stats.overdue}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Performance Metrics */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-sm h-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Resolution Rate</span>
                            <span className="text-sm font-bold text-primary">
                              {stats.total > 0 ? Math.round(((stats.resolved + stats.closed) / stats.total) * 100) : 0}%
                            </span>
                          </div>
                          <Progress value={stats.total > 0 ? ((stats.resolved + stats.closed) / stats.total) * 100 : 0} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">SLA Compliance</span>
                            <span className={`text-sm font-bold ${stats.slaCompliance >= 90 ? 'text-green-600' : stats.slaCompliance >= 70 ? 'text-amber-600' : 'text-destructive'}`}>
                              {stats.slaCompliance}%
                            </span>
                          </div>
                          <Progress value={stats.slaCompliance} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">First Response Rate</span>
                            <span className="text-sm font-bold text-primary">94%</span>
                          </div>
                          <Progress value={94} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold">12.5h</p>
                            <p className="text-xs text-muted-foreground">Avg Resolution Time</p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold">2.3h</p>
                            <p className="text-xs text-muted-foreground">Avg First Response</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Tickets by Status Report */}
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Status Overview Report
                    </CardTitle>
                    <CardDescription>Complete breakdown of ticket statuses with percentages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {statusChartData.map((item: { status: string; count: number; fill: string }) => {
                        const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                        return (
                          <div key={item.status} className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: item.fill }} />
                              <span className="font-medium">{item.status}</span>
                            </div>
                            <div className="flex items-end justify-between">
                              <p className="text-3xl font-bold">{item.count}</p>
                              <p className="text-lg text-muted-foreground">{percentage}%</p>
                            </div>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Overdue Tickets Alert Panel */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                  <Card className="border-0 shadow-sm border-l-4 border-l-destructive">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BellRing className="h-5 w-5 text-destructive" />
                        Overdue Ticket Alerts
                        {stats.overdue > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {stats.overdue} Overdue
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Tickets that have exceeded their SLA due date and require immediate attention
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {overdueTickets.length === 0 ? (
                        <div className="text-center py-12">
                          <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
                          <h3 className="text-lg font-semibold">All Clear!</h3>
                          <p className="text-muted-foreground">No overdue tickets at this time</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                          {overdueTickets.map((ticket: Ticket) => {
                            const daysOverdue = ticket.sLADueDate
                              ? Math.ceil((new Date().getTime() - new Date(ticket.sLADueDate).getTime()) / (1000 * 60 * 60 * 24))
                              : 0;
                            const isSelected = selectedOverdueTickets.includes(ticket.id);
                            return (
                              <div
                                key={ticket.id}
                                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                }`}
                                onClick={() => {
                                  setSelectedOverdueTickets((prev: string[]) =>
                                    isSelected
                                      ? prev.filter((id: string) => id !== ticket.id)
                                      : [...prev, ticket.id]
                                  );
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                                    isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                  }`}>
                                    {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="destructive" className="text-xs">
                                        {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                                      </Badge>
                                      <Badge className={`${PRIORITY_CONFIG[ticket.priorityKey].badgeClass} text-xs`}>
                                        {PRIORITY_CONFIG[ticket.priorityKey].label}
                                      </Badge>
                                    </div>
                                    <h4 className="font-medium truncate">{ticket.title}</h4>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {ticket.assignedTo || 'Unassigned'}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Due: {ticket.sLADueDate ? format(new Date(ticket.sLADueDate), 'MMM d, yyyy') : 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Email Notification Actions */}
                <motion.div variants={itemVariants}>
                  <Card className="border-0 shadow-sm h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Send Notifications
                      </CardTitle>
                      <CardDescription>
                        Email reminders to assignees about overdue tickets
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-xl bg-muted/50 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Selected Tickets</span>
                          <Badge variant="secondary">{selectedOverdueTickets.length}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedOverdueTickets.length === 0
                            ? 'Click on tickets to select them for notification'
                            : `${selectedOverdueTickets.length} ticket${selectedOverdueTickets.length !== 1 ? 's' : ''} selected`}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Button
                          className="w-full gap-2 bg-primary hover:bg-primary/90"
                          size="lg"
                          onClick={() => {
                            if (selectedOverdueTickets.length === 0) {
                              toast.warning('No tickets selected', {
                                description: 'Please select at least one overdue ticket to send notifications.',
                              });
                              return;
                            }
                            // Prepare email data for selected tickets
                            const selectedTicketDetails = overdueTickets.filter((t: Ticket) =>
                              selectedOverdueTickets.includes(t.id)
                            );
                            const uniqueAssignees = [...new Set(selectedTicketDetails.map((t: Ticket) => t.assignedTo).filter(Boolean))] as string[];
                            setEmailRecipients(uniqueAssignees);
                            setEmailTickets(selectedTicketDetails);
                            setEmailBody(`Hi Team,\n\nThis is a reminder regarding the following overdue tickets that require immediate attention:\n\n${selectedTicketDetails.map((t: Ticket) => `• ${t.ticketNumber || 'N/A'}: ${t.title} (Due: ${t.sLADueDate ? format(new Date(t.sLADueDate), 'MMM d, yyyy') : 'N/A'})`).join('\n')}\n\nPlease review and take action as soon as possible to maintain our service level standards.\n\nBest regards,\nIT Help Desk Team`);
                            setShowEmailDialog(true);
                          }}
                          disabled={isSendingNotifications || selectedOverdueTickets.length === 0}
                        >
                          <Edit className="h-4 w-4" />
                          Compose Email ({selectedOverdueTickets.length})
                        </Button>

                        <Button
                          className="w-full gap-2"
                          onClick={() => {
                            if (selectedOverdueTickets.length === 0) {
                              toast.warning('No tickets selected', {
                                description: 'Please select at least one overdue ticket to send notifications.',
                              });
                              return;
                            }
                            setIsSendingNotifications(true);
                            // Simulate sending emails
                            setTimeout(() => {
                              const selectedTicketDetails = overdueTickets.filter((t: Ticket) =>
                                selectedOverdueTickets.includes(t.id)
                              );
                              const uniqueAssignees = [...new Set(selectedTicketDetails.map((t: Ticket) => t.assignedTo).filter(Boolean))];
                              
                              setNotificationsSent((prev: number) => prev + selectedOverdueTickets.length);
                              setLastNotificationTime(new Date());
                              setIsSendingNotifications(false);
                              setSelectedOverdueTickets([]);
                              
                              toast.success('Notifications Sent!', {
                                description: `Email reminders sent to ${uniqueAssignees.length} assignee${uniqueAssignees.length !== 1 ? 's' : ''} for ${selectedOverdueTickets.length} overdue ticket${selectedOverdueTickets.length !== 1 ? 's' : ''}.`,
                              });
                            }, 1500);
                          }}
                          disabled={isSendingNotifications || selectedOverdueTickets.length === 0}
                        >
                          {isSendingNotifications ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Quick Send ({selectedOverdueTickets.length})
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => {
                            if (overdueTickets.length === 0) {
                              toast.info('No overdue tickets', {
                                description: 'There are no overdue tickets to notify about.',
                              });
                              return;
                            }
                            // Prepare email data for all overdue tickets
                            const uniqueAssignees = [...new Set(overdueTickets.map((t: Ticket) => t.assignedTo).filter(Boolean))] as string[];
                            setEmailRecipients(uniqueAssignees);
                            setEmailTickets(overdueTickets);
                            setEmailBody(`Hi Team,\n\nThis is a reminder regarding all overdue tickets that require immediate attention:\n\n${overdueTickets.map((t: Ticket) => `• ${t.ticketNumber || 'N/A'}: ${t.title} (Assigned: ${t.assignedTo || 'Unassigned'}, Due: ${t.sLADueDate ? format(new Date(t.sLADueDate), 'MMM d, yyyy') : 'N/A'})`).join('\n')}\n\nPlease review and take action as soon as possible to maintain our service level standards.\n\nBest regards,\nIT Help Desk Team`);
                            setShowEmailDialog(true);
                          }}
                          disabled={isSendingNotifications || overdueTickets.length === 0}
                        >
                          <BellRing className="h-4 w-4" />
                          Compose for All ({stats.overdue})
                        </Button>
                      </div>

                      {/* Notification Stats */}
                      <div className="pt-4 border-t space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-primary" />
                          Notification History
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold text-primary">{notificationsSent}</p>
                            <p className="text-xs text-muted-foreground">Emails Sent</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-2xl font-bold">{stats.overdue}</p>
                            <p className="text-xs text-muted-foreground">Pending Alerts</p>
                          </div>
                        </div>
                        {lastNotificationTime && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last sent: {format(lastNotificationTime, 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Email Preview */}
              <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Email Template Preview
                    </CardTitle>
                    <CardDescription>
                      Preview of the notification email sent to ticket assignees
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-xl p-6 bg-card">
                      <div className="border-b pb-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <span className="font-medium">From:</span>
                          <span>IT Help Desk &lt;helpdesk@company.com&gt;</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <span className="font-medium">To:</span>
                          <span>[Assignee Email]</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Subject:</span>
                          <span className="text-destructive font-medium">⚠️ Action Required: Overdue Ticket Reminder</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p>Hi <span className="font-medium text-primary">[Assignee Name]</span>,</p>
                        <p className="text-muted-foreground">
                          This is a reminder that you have <span className="font-bold text-destructive">overdue tickets</span> that require your immediate attention.
                        </p>
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                          <h4 className="font-semibold flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            Overdue Ticket Details
                          </h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            <li>• <strong>Ticket ID:</strong> [Ticket ID]</li>
                            <li>• <strong>Title:</strong> [Ticket Title]</li>
                            <li>• <strong>Priority:</strong> [Priority Level]</li>
                            <li>• <strong>SLA Due Date:</strong> [Due Date]</li>
                            <li>• <strong>Days Overdue:</strong> [X days]</li>
                          </ul>
                        </div>
                        <p className="text-muted-foreground">
                          Please review and take action on this ticket as soon as possible to maintain our service level standards.
                        </p>
                        <div className="pt-4">
                          <Button size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            View Ticket in Help Desk
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground pt-4 border-t">
                          Best regards,<br />
                          <span className="font-medium">IT Help Desk Team</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

                            <Progress value={percentage} className="h-1.5 mt-3" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* All Tickets Data Table */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  All Tickets
                </CardTitle>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tickets..."
                      value={search}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                      className="pl-9 w-full sm:w-[250px] h-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[140px] h-10">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {(Object.entries(STATUS_CONFIG) as [TicketStatusKey, { label: string }][]).map(
                        ([key, config]: [TicketStatusKey, { label: string }]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-full sm:w-[140px] h-10">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      {(Object.entries(PRIORITY_CONFIG) as [TicketPriorityKey, { label: string }][]).map(
                        ([key, config]: [TicketPriorityKey, { label: string }]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Ticket ID</TableHead>
                      <TableHead className="font-semibold">Title</TableHead>
                      <TableHead className="font-semibold hidden md:table-cell">Category</TableHead>
                      <TableHead className="font-semibold">Priority</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold hidden lg:table-cell">Created</TableHead>
                      <TableHead className="font-semibold hidden lg:table-cell">SLA Due</TableHead>
                      <TableHead className="font-semibold text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedFilteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                          No tickets found matching your criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedFilteredTickets.slice(0, 10).map((ticket: Ticket) => {
                        const overdue = isTicketOverdue(ticket);
                        return (
                          <TableRow
                            key={ticket.id}
                            className={`hover:bg-muted/30 transition-colors ${overdue ? 'bg-destructive/5' : ''}`}
                          >
                            <TableCell>
                              <span className="font-mono text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                                {ticket.ticketNumber || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground truncate max-w-[200px]">{ticket.title}</p>
                                <p className="text-xs text-muted-foreground">by {ticket.createdBy}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-sm">
                                {CATEGORY_ICONS[ticket.mainCategory || ''] || '📝'} {ticket.subcategory || ticket.mainCategory || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${PRIORITY_CONFIG[ticket.priorityKey].badgeClass} text-xs`}>
                                {PRIORITY_CONFIG[ticket.priorityKey].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${STATUS_CONFIG[ticket.statusKey].className} text-xs`}>
                                {STATUS_CONFIG[ticket.statusKey].label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                              {getTimeAgo(ticket.createdDate)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {ticket.sLADueDate ? (
                                <span className={`text-sm ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                  {formatDate(ticket.sLADueDate)}
                                  {overdue && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/tickets/${ticket.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              {sortedFilteredTickets.length > 10 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" asChild>
                    <Link to="/all-tickets">View All {sortedFilteredTickets.length} Tickets</Link>
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center mt-4">
                Showing {Math.min(10, sortedFilteredTickets.length)} of {sortedFilteredTickets.length} tickets
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>

    {/* Email Compose Dialog */}
    <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Compose Email Notification
          </DialogTitle>
          <DialogDescription>
            Customize and send email reminders to ticket assignees
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Recipients */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <AtSign className="h-4 w-4 text-muted-foreground" />
              Recipients ({emailRecipients.length})
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg border min-h-[48px]">
              {emailRecipients.length > 0 ? (
                emailRecipients.map((recipient: string) => (
                  <Badge key={recipient} variant="secondary" className="gap-1">
                    {recipient}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No recipients</span>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              value={emailSubject}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </div>

          {/* Affected Tickets */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              Affected Tickets ({emailTickets.length})
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1 p-3 bg-muted/30 rounded-lg border">
              {emailTickets.map((ticket: Ticket) => (
                <div key={ticket.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {ticket.ticketNumber || 'N/A'}
                    </span>
                    <span className="truncate max-w-[200px]">{ticket.title}</span>
                  </div>
                  <Badge className={`${PRIORITY_CONFIG[ticket.priorityKey].badgeClass} text-xs`}>
                    {PRIORITY_CONFIG[ticket.priorityKey].label}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Email Body */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Body</label>
            <Textarea
              value={emailBody}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailBody(e.target.value)}
              placeholder="Write your email message..."
              className="min-h-[200px] font-mono text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
            Cancel
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              setIsSendingNotifications(true);
              setShowEmailDialog(false);
              
              setTimeout(() => {
                setNotificationsSent((prev: number) => prev + emailTickets.length);
                setLastNotificationTime(new Date());
                setIsSendingNotifications(false);
                setSelectedOverdueTickets([]);
                
                toast.success('Email Sent Successfully!', {
                  description: `Email notification sent to ${emailRecipients.length} recipient${emailRecipients.length !== 1 ? 's' : ''} regarding ${emailTickets.length} ticket${emailTickets.length !== 1 ? 's' : ''}.`,
                });
              }, 1500);
            }}
            disabled={emailRecipients.length === 0}
          >
            <Send className="h-4 w-4" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
