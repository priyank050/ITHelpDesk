import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Chatbot from './components/chatbot';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from './components/ui/sidebar';
import {
  LayoutDashboard,
  Plus,
  FileText,
  ListTodo,
  Headset,
  Shield,
  Settings,
  Sparkles,
  Bell,
  Search,
  ChevronRight,
  Mail,
  AlertTriangle,
  Clock,
  Building2,
  Users,
  Volume2,
  VolumeX,
  CheckCircle,
  Ticket as TicketIcon,
} from 'lucide-react';
import { cn } from './lib/utils';
import { useUser } from './hooks/use-user';
import { isAdmin, isITSupport, getUserRole } from './lib/admin-config';
import { CompanyHeader } from './components/company-logo';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './components/ui/popover';
import { Toaster, toast } from 'sonner';
import { useTicketList } from './generated/hooks/use-ticket';
import type { Ticket as TicketType } from './generated/models/ticket-model';
import { isTicketOverdue, PRIORITY_CONFIG, getTimeAgo } from './lib/ticket-utils';
import { playNotificationSound, playUrgentSound } from './lib/notification-sound';

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  description?: string;
  requiresITSupport?: boolean;
  requiresAdmin?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & analytics', requiresAdmin: true },
  { to: '/create', icon: Plus, label: 'Create Ticket', description: 'Submit a new request' },
  { to: '/my-tickets', icon: FileText, label: 'My Tickets', description: 'Track your requests' },
  { to: '/all-tickets', icon: ListTodo, label: 'All Tickets', description: 'Manage all tickets', requiresITSupport: true },
  { to: '/companies', icon: Building2, label: 'Companies', description: 'Manage companies', requiresAdmin: true },
  { to: '/departments', icon: Users, label: 'Departments', description: 'Manage departments', requiresAdmin: true },
  { to: '/user-management', icon: Users, label: 'User Management', description: 'Manage users', requiresAdmin: true },
  { to: '/role-permissions', icon: Shield, label: 'Role Permissions', description: 'Permission matrix', requiresAdmin: true },
  { to: '/admin-settings', icon: Settings, label: 'Admin Settings', description: 'Branding & data', requiresAdmin: true },
];

const navItemVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  hover: { x: 4 },
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { data: tickets = [] } = useTicketList();
  const userEmail = user?.userPrincipalName;
  const userRole = getUserRole(userEmail);
  const hasITAccess = isITSupport(userEmail);
  const hasAdminAccess = isAdmin(userEmail);

  // Sound preferences
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('notification-sound-enabled');
    return stored !== 'false'; // Default to true
  });

  // Toggle sound and persist preference
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('notification-sound-enabled', String(newValue));
    toast.success(newValue ? 'Sound notifications enabled' : 'Sound notifications muted');
  };

  // Calculate notification counts
  const overdueTickets = tickets.filter((t: TicketType) => isTicketOverdue(t));
  const overdueCount = overdueTickets.length;
  const openCount = tickets.filter((t: TicketType) => t.statusKey === 'StatusKey0').length;

  // Track new tickets for notification
  const prevTicketCountRef = useRef<number>(tickets.length);
  const prevTicketIdsRef = useRef<Set<string>>(new Set(tickets.map((t: TicketType) => t.id)));
  const isInitialLoadRef = useRef<boolean>(true);
  const [recentNewTickets, setRecentNewTickets] = useState<TicketType[]>([]);

  // New ticket notification effect
  useEffect(() => {
    // Skip on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevTicketCountRef.current = tickets.length;
      prevTicketIdsRef.current = new Set(tickets.map((t: TicketType) => t.id));
      return;
    }

    const currentIds = new Set(tickets.map((t: TicketType) => t.id));
    const prevIds = prevTicketIdsRef.current;

    // Find truly new tickets (IDs that didn't exist before)
    const newTickets = tickets.filter((t: TicketType) => !prevIds.has(t.id));

    if (newTickets.length > 0) {
      // Add to recent new tickets list (keep last 10)
      setRecentNewTickets(prev => [...newTickets, ...prev].slice(0, 10));

      // Get the newest ticket for the toast
      const newestTicket = newTickets[0];

      // Play sound based on priority
      if (soundEnabled) {
        const isHighPriority = newestTicket.priorityKey === 'PriorityKey2' || newestTicket.priorityKey === 'PriorityKey3';
        if (isHighPriority) {
          playUrgentSound();
        } else {
          playNotificationSound('info');
        }
      }

      // Show toast notification
      toast.info(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">🎫 New Ticket Raised</span>
          <span className="text-sm opacity-90">{newestTicket.title}</span>
          <span className="text-xs opacity-70">Priority: {PRIORITY_CONFIG[newestTicket.priorityKey].label}</span>
        </div>,
        {
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => navigate(`/ticket/${newestTicket.id}`),
          },
        }
      );
    }

    prevTicketCountRef.current = tickets.length;
    prevTicketIdsRef.current = currentIds;
  }, [tickets, navigate, soundEnabled]);

  // Clear a new ticket from the list (mark as seen)
  const markTicketAsSeen = (ticketId: string) => {
    setRecentNewTickets(prev => prev.filter((t: TicketType) => t.id !== ticketId));
  };

  // Clear all new ticket notifications
  const clearAllNewTickets = () => {
    setRecentNewTickets([]);
  };

  // Total notification count (overdue + new)
  const totalNotificationCount = overdueCount + recentNewTickets.length;

  // Email notification handler
  const handleSendEmailNotification = async (ticket: TicketType) => {
    try {
      // Simulate sending email
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`Email notification sent for ticket: ${ticket.title}`);
    } catch (error: unknown) {
      toast.error('Failed to send email notification');
    }
  };

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter((item: NavItem) => {
    if (item.requiresAdmin) {
      return hasAdminAccess;
    }
    if (item.requiresITSupport) {
      return hasITAccess;
    }
    return true;
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r-0">
          {/* Header with Logo */}
          <SidebarHeader className="p-5 border-b border-sidebar-border">
            {/* Company Logos & Names */}
            <CompanyHeader />
            
            {/* App Title */}
            <motion.div 
              className="flex items-center gap-3 mt-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-purple-400 shadow-lg shadow-sidebar-primary/25">
                  <Headset className="h-5 w-5 text-sidebar-primary-foreground" />
                </div>
                <motion.div 
                  className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-400 border-2 border-sidebar"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground tracking-tight">IT Help Desk</h1>
                <p className="text-xs text-sidebar-foreground/60 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Support Portal
                </p>
              </div>
            </motion.div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {visibleNavItems.map((item: NavItem, index: number) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    return (
                      <motion.div
                        key={item.to}
                        variants={navItemVariants}
                        initial="initial"
                        animate="animate"
                        whileHover="hover"
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                      >
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <NavLink
                              to={item.to}
                              className={cn(
                                'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
                                isActive 
                                  ? 'bg-sidebar-accent shadow-sm' 
                                  : 'hover:bg-sidebar-accent/50'
                              )}
                            >
                              <div className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
                                isActive 
                                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md' 
                                  : 'bg-sidebar-accent/50 text-sidebar-foreground/70 group-hover:bg-sidebar-accent group-hover:text-sidebar-foreground'
                              )}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={cn(
                                  'block text-sm font-medium truncate',
                                  isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/80'
                                )}>
                                  {item.label}
                                </span>
                                {item.description && (
                                  <span className="block text-xs text-sidebar-foreground/50 truncate">
                                    {item.description}
                                  </span>
                                )}
                              </div>
                              {isActive && (
                                <ChevronRight className="h-4 w-4 text-sidebar-foreground/50" />
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </motion.div>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* User Role Badge & Stats */}
            <div className="mt-auto pt-4 space-y-4">
              {/* Quick Stats */}
              {hasITAccess && (openCount > 0 || overdueCount > 0) && (
                <motion.div 
                  className="px-3 py-3 rounded-xl bg-sidebar-accent/30 space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">Quick Stats</p>
                  <div className="flex gap-2">
                    <div className="flex-1 text-center py-1.5 rounded-lg bg-sidebar-accent/50">
                      <div className="text-lg font-bold text-sidebar-foreground">{openCount}</div>
                      <div className="text-xs text-sidebar-foreground/60">Open</div>
                    </div>
                    {overdueCount > 0 && (
                      <div className="flex-1 text-center py-1.5 rounded-lg bg-destructive/20">
                        <div className="text-lg font-bold text-destructive">{overdueCount}</div>
                        <div className="text-xs text-destructive/80">Overdue</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Role Badge */}
              {userRole !== 'employee' && (
                <motion.div 
                  className="p-3 border-t border-sidebar-border"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-sidebar-primary/20 to-sidebar-primary/10 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-sidebar-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-sidebar-accent text-sidebar-foreground border-0"
                      >
                        {userRole === 'admin' ? 'Administrator' : 'IT Support'}
                      </Badge>
                      <p className="text-xs text-sidebar-foreground/50 truncate mt-0.5">
                        {user?.fullName}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Premium Header */}
          <header className="h-16 border-b border-border bg-card/80 backdrop-blur-xl px-6 flex items-center gap-4 sticky top-0 z-40">
            <SidebarTrigger className="-ml-2" />
            
            {/* Breadcrumb / Page Title */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={location.pathname}
                  className="text-lg font-semibold text-foreground"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {navItems.find((item: NavItem) => item.to === location.pathname)?.label || 'Ticket Details'}
                </motion.h2>
              </AnimatePresence>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tickets..." 
                className="pl-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
              />
            </div>

            {/* Notifications Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  {totalNotificationCount > 0 && (
                    <motion.span 
                      className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      {totalNotificationCount > 9 ? '9+' : totalNotificationCount}
                    </motion.span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0 z-50" align="end" sideOffset={8}>
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={toggleSound}
                        title={soundEnabled ? 'Mute sound alerts' : 'Enable sound alerts'}
                      >
                        {soundEnabled ? (
                          <Volume2 className="h-4 w-4 text-primary" />
                        ) : (
                          <VolumeX className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      {totalNotificationCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {totalNotificationCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="new" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 h-10 rounded-none border-b">
                    <TabsTrigger value="new" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary gap-1.5">
                      <TicketIcon className="h-3.5 w-3.5" />
                      New
                      {recentNewTickets.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">{recentNewTickets.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="overdue" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-destructive gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Overdue
                      {overdueCount > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-xs">{overdueCount}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="new" className="m-0">
                    <ScrollArea className="h-[320px]">
                      {recentNewTickets.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No new tickets</p>
                          <p className="text-xs opacity-70 mt-1">You're all caught up!</p>
                        </div>
                      ) : (
                        <>
                          {recentNewTickets.map((ticket: TicketType) => (
                            <div
                              key={ticket.id}
                              className="p-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => {
                                navigate(`/ticket/${ticket.id}`);
                                markTicketAsSeen(ticket.id);
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <TicketIcon className="h-4 w-4 text-primary" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{ticket.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${PRIORITY_CONFIG[ticket.priorityKey].className}`}
                                    >
                                      {PRIORITY_CONFIG[ticket.priorityKey].label}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {getTimeAgo(ticket.createdDate)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    By: {ticket.createdBy}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 flex-shrink-0"
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    markTicketAsSeen(ticket.id);
                                    toast.success('Marked as seen');
                                  }}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div className="p-3 border-t border-border">
                            <Button
                              variant="ghost"
                              className="w-full text-sm"
                              onClick={clearAllNewTickets}
                            >
                              Clear all
                            </Button>
                          </div>
                        </>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="overdue" className="m-0">
                    <ScrollArea className="h-[320px]">
                      {overdueTickets.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No overdue tickets</p>
                          <p className="text-xs opacity-70 mt-1">Great job staying on top of things!</p>
                        </div>
                      ) : (
                        <>
                          {overdueTickets.slice(0, 8).map((ticket: TicketType) => (
                            <div
                              key={ticket.id}
                              className="p-3 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => navigate(`/ticket/${ticket.id}`)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{ticket.title}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${PRIORITY_CONFIG[ticket.priorityKey].className}`}
                                    >
                                      {PRIORITY_CONFIG[ticket.priorityKey].label}
                                    </Badge>
                                    <span className="text-xs text-destructive flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Overdue
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 flex-shrink-0"
                                  onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    handleSendEmailNotification(ticket);
                                  }}
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {overdueTickets.length > 8 && (
                            <div className="p-3 border-t border-border">
                              <Button
                                variant="ghost"
                                className="w-full text-sm"
                                onClick={() => navigate('/all-tickets?filter=overdue')}
                              >
                                View all {overdueCount} overdue tickets
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>

            {/* User Avatar with Email Tooltip */}
            {user && (
              <Popover>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-3 pl-3 border-l border-border cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-md">
                      {user.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-medium text-foreground leading-none">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{userRole === 'admin' ? 'Admin' : userRole === 'it_support' ? 'IT Support' : 'Employee'}</p>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="end">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-purple-400/10 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg">
                        {user.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{user.fullName}</p>
                        <Badge 
                          variant="secondary" 
                          className="mt-1 text-xs"
                        >
                          {userRole === 'admin' ? 'Administrator' : userRole === 'it_support' ? 'IT Support' : 'Employee'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Email Address</p>
                        <p className="text-sm font-medium text-foreground truncate">{user.userPrincipalName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Access Level</p>
                        <p className="text-sm font-medium text-foreground">
                          {hasAdminAccess ? 'Full Admin Access' : hasITAccess ? 'IT Support Access' : 'Standard User'}
                        </p>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </header>

          {/* Main Content with Page Transitions */}
          <div className="flex-1 overflow-auto bg-background scrollbar-thin">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="min-h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <Toaster richColors position="top-right" />
      <Chatbot />
    </SidebarProvider>
  );
}
