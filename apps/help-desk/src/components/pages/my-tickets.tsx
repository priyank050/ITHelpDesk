import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Clock,
  AlertTriangle,
  FileText,
  ChevronRight,
  Inbox,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from './components/ui/empty';
import { InMemoryDataBanner } from './generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from './generated/hooks';
import { useTicketList } from './generated/hooks/use-ticket';
import { useUser } from './hooks/use-user';
import type { Ticket } from './generated/models/ticket-model';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  isTicketOverdue,
  getTimeAgo,
} from './lib/ticket-utils';
import { CATEGORY_ICONS } from './lib/category-data';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
} as const;

export default function MyTicketsPage() {
  const { data: user } = useUser();
  const { data: allTickets = [], isLoading } = useTicketList();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Filter to only show current user's tickets
  const myTickets = allTickets.filter(
    (t: Ticket) => t.createdBy === user?.fullName || t.requesterEmail === user?.userPrincipalName
  );

  // Apply filters
  const filteredTickets = myTickets.filter((ticket: Ticket) => {
    const matchesSearch =
      searchQuery === '' ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || ticket.statusKey === statusFilter;

    const matchesPriority =
      priorityFilter === 'all' || ticket.priorityKey === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort by created date descending
  const sortedTickets = [...filteredTickets].sort(
    (a: Ticket, b: Ticket) =>
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  );

  // Stats
  const openCount = myTickets.filter((t: Ticket) => t.statusKey === 'StatusKey0' || t.statusKey === 'StatusKey1').length;
  const overdueCount = myTickets.filter((t: Ticket) => isTicketOverdue(t)).length;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <InMemoryDataBanner
        show={HAS_IN_MEMORY_TABLES}
        message="This app uses draft tables for testing. Data entered won't be saved."
        className="bg-accent text-accent-foreground"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">My Tickets</h1>
              <p className="text-muted-foreground">Track and manage your support requests</p>
            </div>
          </div>
          <Button asChild size="lg" className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
            <Link to="/create">
              <Plus className="h-5 w-5 mr-2" />
              New Ticket
              <Sparkles className="h-4 w-4 ml-2 opacity-70" />
            </Link>
          </Button>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{myTickets.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold">{openCount}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`hover-lift ${overdueCount > 0 ? 'border-destructive/30' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-destructive' : ''}`}>{overdueCount}</p>
                </div>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${overdueCount > 0 ? 'bg-destructive/10' : 'bg-muted'}`}>
                  <AlertTriangle className={`h-5 w-5 ${overdueCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold">
                    {myTickets.filter((t: Ticket) => t.statusKey === 'StatusKey2' || t.statusKey === 'StatusKey3').length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card className="hover-lift">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Filter className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Search & Filter</CardTitle>
                  <CardDescription>{filteredTickets.length} of {myTickets.length} tickets</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, ID, or description..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-muted/50 border-transparent">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="StatusKey0">Open</SelectItem>
                    <SelectItem value="StatusKey1">In Progress</SelectItem>
                    <SelectItem value="StatusKey2">Resolved</SelectItem>
                    <SelectItem value="StatusKey3">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-muted/50 border-transparent">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="PriorityKey0">Low</SelectItem>
                    <SelectItem value="PriorityKey1">Medium</SelectItem>
                    <SelectItem value="PriorityKey2">High</SelectItem>
                    <SelectItem value="PriorityKey3">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tickets List */}
        <motion.div variants={itemVariants}>
          {isLoading ? (
            <div className="space-y-4" aria-hidden="true">
              {[1, 2, 3, 4].map((i: number) => (
                <Card key={i} className="p-6">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : sortedTickets.length === 0 ? (
            <Card className="py-16">
              <Empty className="max-w-md mx-auto">
                <EmptyContent>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mx-auto mb-4">
                    <Inbox className="h-10 w-10 text-muted-foreground" />
                  </div>
                </EmptyContent>
                <EmptyHeader>
                  <EmptyTitle>No tickets found</EmptyTitle>
                  <EmptyDescription>
                    {myTickets.length === 0
                      ? "You haven't created any tickets yet. Submit a new request to get started."
                      : 'No tickets match your current filters. Try adjusting your search criteria.'}
                  </EmptyDescription>
                </EmptyHeader>
                <div className="mt-6">
                  <Button asChild>
                    <Link to="/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Ticket
                    </Link>
                  </Button>
                </div>
              </Empty>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedTickets.map((ticket: Ticket, index: number) => {
                const isOverdue = isTicketOverdue(ticket);
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Link to={`/ticket-details?id=${ticket.id}`}>
                      <Card className={`group transition-all duration-200 hover-lift cursor-pointer ${
                        isOverdue
                          ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10'
                          : 'hover:border-primary/30'
                      }`}>
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            {/* Category Icon */}
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                              isOverdue ? 'bg-destructive/10' : 'bg-primary/10'
                            }`}>
                              <span className="text-2xl">
                                {CATEGORY_ICONS[ticket.mainCategory] || '📁'}
                              </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="min-w-0">
                                  {/* Ticket Number */}
                                  <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded mb-1.5 inline-block">
                                    {ticket.ticketNumber}
                                  </code>
                                  {/* Title */}
                                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                                    {ticket.title}
                                  </h3>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </div>

                              {/* Category breadcrumb */}
                              <p className="text-sm text-muted-foreground mb-3 truncate">
                                {ticket.mainCategory}
                                {ticket.subcategory && ` › ${ticket.subcategory}`}
                              </p>

                              {/* Footer */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={PRIORITY_CONFIG[ticket.priorityKey].badgeClass}>
                                    {PRIORITY_CONFIG[ticket.priorityKey].label}
                                  </Badge>
                                  <Badge variant="outline" className={STATUS_CONFIG[ticket.statusKey].className}>
                                    {STATUS_CONFIG[ticket.statusKey].label}
                                  </Badge>
                                  {isOverdue && (
                                    <Badge className="bg-destructive text-destructive-foreground gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Overdue
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground hidden sm:block">
                                  {getTimeAgo(ticket.createdDate)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
