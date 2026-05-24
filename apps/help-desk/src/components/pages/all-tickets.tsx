import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, AlertTriangle, User, MoreHorizontal, Mail, Users, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Card, CardContent } from './components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './components/ui/tooltip';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './components/ui/tabs';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from './components/ui/empty';
import { InMemoryDataBanner } from './generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from './generated/hooks';
import { useTicketList, useUpdateTicket } from './generated/hooks/use-ticket';
import type { Ticket, TicketStatusKey, TicketPriorityKey } from './generated/models/ticket-model';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  isTicketOverdue,
  formatDate,
} from './lib/ticket-utils';
import { MAIN_CATEGORIES, CATEGORY_ICONS } from './lib/category-data';
import { toast } from 'sonner';
import { AssignmentWorkflow } from './components/assignment-workflow';

import { IT_STAFF_NAMES } from './lib/admin-config';
import { useUser } from './hooks/use-user';
export default function AllTicketsPage() {
  const { data: tickets = [], isLoading } = useTicketList();
  const updateTicket = useUpdateTicket();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('tickets');
  const filteredTickets = tickets.filter((ticket: Ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      ticket.description.toLowerCase().includes(search.toLowerCase()) ||
      ticket.createdBy.toLowerCase().includes(search.toLowerCase()) ||
      (ticket.ticketNumber && ticket.ticketNumber.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || ticket.statusKey === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priorityKey === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.mainCategory === categoryFilter;
    const matchesAssignee =
      assigneeFilter === 'all' ||
      (assigneeFilter === 'unassigned' && !ticket.assignedTo) ||
      ticket.assignedTo === assigneeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssignee;
  });

  const sortedTickets = [...filteredTickets].sort((a: Ticket, b: Ticket) => {
    // Sort by priority (Critical first), then by date
    const priorityOrder = { PriorityKey3: 0, PriorityKey2: 1, PriorityKey1: 2, PriorityKey0: 3 };
    const priorityDiff = priorityOrder[a.priorityKey] - priorityOrder[b.priorityKey];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
  });

  const handleAssign = async (ticketId: string, assignee: string) => {
    try {
      await updateTicket.mutateAsync({
        id: ticketId,
        changedFields: {
          assignedTo: assignee,
          statusKey: 'StatusKey1', // Set to In Progress when assigned
        },
      });
      toast.success(`Ticket assigned to ${assignee}`);
    } catch (error: unknown) {
      toast.error('Failed to assign ticket');
    }
  };

  const handleBulkAssign = async (ticketIds: string[], assignee: string) => {
    try {
      for (const ticketId of ticketIds) {
        await updateTicket.mutateAsync({
          id: ticketId,
          changedFields: {
            assignedTo: assignee,
            statusKey: 'StatusKey1',
          },
        });
      }
      toast.success(`${ticketIds.length} tickets assigned to ${assignee}`);
    } catch (error: unknown) {
      toast.error('Failed to assign tickets');
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatusKey) => {
    try {
      await updateTicket.mutateAsync({
        id: ticketId,
        changedFields: { statusKey: newStatus },
      });
      toast.success('Status updated');
    } catch (error: unknown) {
      toast.error('Failed to update status');
    }
  };

  const uniqueAssignees = [...new Set(tickets.map((t: Ticket) => t.assignedTo).filter(Boolean))] as string[];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <InMemoryDataBanner
        show={HAS_IN_MEMORY_TABLES}
        message="This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage."
        className="bg-accent text-accent-foreground"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">All Tickets</h1>
          <p className="text-sm text-muted-foreground">Manage and assign support tickets</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
          <TabsTrigger value="tickets" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <TableIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">All</span> Tickets
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Assignment</span> Workflow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="mt-4">
          <AssignmentWorkflow
            tickets={tickets}
            onAssign={handleAssign}
            onBulkAssign={handleBulkAssign}
          />
        </TabsContent>

        <TabsContent value="tickets" className="mt-4 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-3 md:pt-4">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets, users..."
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="pl-10"
                  />
  
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs sm:text-sm">
                      <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
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
                    <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs sm:text-sm">
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

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {MAIN_CATEGORIES.map((cat: string) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_ICONS[cat]} {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs sm:text-sm">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Assignees</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {uniqueAssignees.map((assignee: string) => (
                        <SelectItem key={assignee} value={assignee}>
                          {assignee}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          {isLoading ? (
            <div className="space-y-4" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((i: number) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : sortedTickets.length === 0 ? (
            <Empty className="py-16">
              <EmptyHeader>
                <EmptyTitle>No tickets found</EmptyTitle>
                <EmptyDescription>
                  {tickets.length === 0
                    ? 'No support tickets have been submitted yet.'
                    : 'No tickets match your current filters.'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px] md:min-w-[300px]">Ticket</TableHead>
                      <TableHead className="hidden lg:table-cell">Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="hidden sm:table-cell">Status</TableHead>
                      <TableHead className="hidden md:table-cell">Assignee</TableHead>
                      <TableHead className="hidden sm:table-cell">Due</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTickets.map((ticket: Ticket) => {
                      const overdue = isTicketOverdue(ticket);
                      return (
                        <TableRow
                          key={ticket.id}
                          className={overdue ? 'bg-destructive/5' : ''}
                        >
                          <TableCell>
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="hover:underline"
                            >
                              <div className="flex items-center gap-2">
                                {ticket.ticketNumber && (
                                  <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                    {ticket.ticketNumber}
                                  </span>
                                )}
                                <span className="font-medium">{ticket.title}</span>
                                {overdue && (
                                  <AlertTriangle className="h-4 w-4 text-destructive" />
                                )}
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="text-xs text-muted-foreground cursor-help flex items-center gap-1">
                                      by {ticket.createdBy}
                                      {ticket.requesterEmail && (
                                        <Mail className="h-3 w-3 text-muted-foreground/50" />
                                      )}
                                    </p>
                                  </TooltipTrigger>
                                  {ticket.requesterEmail && (
                                    <TooltipContent side="bottom" className="max-w-xs">
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-primary" />
                                        <span className="font-mono text-sm">{ticket.requesterEmail}</span>
                                      </div>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </Link>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-sm">
                              {ticket.mainCategory ? `${CATEGORY_ICONS[ticket.mainCategory] || ''} ${ticket.mainCategory}` : 'Uncategorized'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${PRIORITY_CONFIG[ticket.priorityKey].badgeClass} text-xs`}>
                              {PRIORITY_CONFIG[ticket.priorityKey].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Select
                              value={ticket.statusKey}
                              onValueChange={(val: string) => handleStatusChange(ticket.id, val as TicketStatusKey)}
                            >
                              <SelectTrigger className="w-[110px] sm:w-[130px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.entries(STATUS_CONFIG) as [TicketStatusKey, { label: string }][]).map(
                                  ([key, config]: [TicketStatusKey, { label: string }]) => (
                                    <SelectItem key={key} value={key}>
                                      {config.label}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Select
                              value={ticket.assignedTo || 'unassigned'}
                              onValueChange={(val: string) =>
                                val !== 'unassigned' && handleAssign(ticket.id, val)
                              }
                            >
                              <SelectTrigger className="w-[120px] sm:w-[140px] h-8 text-xs">
                                <SelectValue placeholder="Assign..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned" disabled>
                                  Unassigned
                                </SelectItem>
                                {IT_STAFF_NAMES.map((staff: string) => (
                                  <SelectItem key={staff} value={staff}>
                                    {staff}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {ticket.sLADueDate ? (
                              <span
                                className={`text-xs sm:text-sm ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
                              >
                                {formatDate(ticket.sLADueDate)}
                              </span>
                            ) : (
                              <span className="text-xs sm:text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/tickets/${ticket.id}`}>View Details</Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </motion.div>
          )}

          {/* Summary */}
          {!isLoading && sortedTickets.length > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Showing {sortedTickets.length} of {tickets.length} tickets
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}