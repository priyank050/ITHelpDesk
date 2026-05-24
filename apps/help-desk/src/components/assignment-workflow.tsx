import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Briefcase,
  Zap,
  Target,
  BarChart3,
  History,
  ArrowRightLeft,
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Progress } from './components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import { Checkbox } from './components/ui/checkbox';
import { ScrollArea } from './components/ui/scroll-area';
import { Separator } from './components/ui/separator';
import { toast } from 'sonner';
import { IT_STAFF } from './lib/admin-config';
import { PRIORITY_CONFIG, STATUS_CONFIG, formatDate } from './lib/ticket-utils';
import type { Ticket, TicketStatusKey, TicketPriorityKey } from './generated/models/ticket-model';
import { useAssignmentHistoryList, useCreateAssignmentHistory } from './generated/hooks/use-assignment-history';
import type { AssignmentHistory } from './generated/models/assignment-history-model';

interface AssignmentWorkflowProps {
  tickets: Ticket[];
  onAssign: (ticketId: string, assignee: string) => Promise<void>;
  onBulkAssign: (ticketIds: string[], assignee: string) => Promise<void>;
}

interface StaffWorkload {
  name: string;
  email: string;
  assignedCount: number;
  criticalCount: number;
  highCount: number;
  openCount: number;
  tickets: Ticket[];
}

export function AssignmentWorkflow({ tickets, onAssign, onBulkAssign }: AssignmentWorkflowProps) {
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [workflowView, setWorkflowView] = useState<'unassigned' | 'workload' | 'history'>('unassigned');

  // Fetch assignment history
  const { data: assignmentHistory = [] } = useAssignmentHistoryList();
  const createAssignmentHistory = useCreateAssignmentHistory();

  // Calculate workload for each staff member
  const staffWorkload = useMemo((): StaffWorkload[] => {
    return IT_STAFF.map((staff) => {
      const staffTickets = tickets.filter((t: Ticket) => t.assignedTo === staff.name);
      return {
        name: staff.name,
        email: staff.email,
        assignedCount: staffTickets.length,
        criticalCount: staffTickets.filter((t: Ticket) => t.priorityKey === 'PriorityKey3').length,
        highCount: staffTickets.filter((t: Ticket) => t.priorityKey === 'PriorityKey2').length,
        openCount: staffTickets.filter(
          (t: Ticket) => t.statusKey === 'StatusKey0' || t.statusKey === 'StatusKey1'
        ).length,
        tickets: staffTickets,
      };
    }).sort((a: StaffWorkload, b: StaffWorkload) => a.assignedCount - b.assignedCount);
  }, [tickets]);

  // Get unassigned tickets
  const unassignedTickets = useMemo(() => {
    return tickets.filter((t: Ticket) => !t.assignedTo);
  }, [tickets]);

  // Get tickets needing attention (unassigned + critical/high priority)
  const urgentUnassigned = useMemo(() => {
    return unassignedTickets.filter(
      (t: Ticket) => t.priorityKey === 'PriorityKey3' || t.priorityKey === 'PriorityKey2'
    );
  }, [unassignedTickets]);

  const handleSelectTicket = (ticketId: string) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTickets.size === unassignedTickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(unassignedTickets.map((t: Ticket) => t.id)));
    }
  };

  const handleQuickAssign = async (ticketId: string, assignee: string) => {
    try {
      const ticket = tickets.find((t: Ticket) => t.id === ticketId);
      await onAssign(ticketId, assignee);
      // Record assignment history
      await createAssignmentHistory.mutateAsync({
        ticket: { id: ticketId, ticketNumber: ticket?.ticketNumber || '' },
        assignedBy: 'System Admin',
        assignedTo: assignee,
        previousAssignee: ticket?.assignedTo || undefined,
        assignedDate: new Date().toISOString(),
        notes: 'Quick assignment from workflow',
      });
      selectedTickets.delete(ticketId);
      setSelectedTickets(new Set(selectedTickets));
    } catch (error: unknown) {
      console.error('Assignment failed:', error);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedAssignee || selectedTickets.size === 0) return;
    setIsAssigning(true);
    try {
      await onBulkAssign(Array.from(selectedTickets), selectedAssignee);
      setSelectedTickets(new Set());
      setBulkAssignOpen(false);
      setSelectedAssignee('');
    } catch (error: unknown) {
      console.error('Bulk assignment failed:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const getSuggestedAssignee = (): string | null => {
    // Suggest the staff member with lowest workload
    const available = staffWorkload.filter((s: StaffWorkload) => s.assignedCount < 10);
    return available.length > 0 ? available[0].name : null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();
  };

  const getWorkloadLevel = (count: number): 'low' | 'medium' | 'high' => {
    if (count <= 3) return 'low';
    if (count <= 7) return 'high';
    return 'high';
  };

  const getWorkloadColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'bg-emerald-500';
      case 'medium':
        return 'bg-amber-500';
      case 'high':
        return 'bg-rose-500';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-3 md:pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Unassigned</p>
                  <p className="text-xl md:text-2xl font-bold">{unassignedTickets.length}</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="p-3 md:pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Urgent</p>
                  <p className="text-xl md:text-2xl font-bold">{urgentUnassigned.length}</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-accent-foreground">
            <CardContent className="p-3 md:pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Staff</p>
                  <p className="text-xl md:text-2xl font-bold">{IT_STAFF.length}</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-accent flex items-center justify-center">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-secondary">
            <CardContent className="p-3 md:pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Avg Load</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {staffWorkload.length > 0
                      ? Math.round(
                          staffWorkload.reduce((sum: number, s: StaffWorkload) => sum + s.assignedCount, 0) /
                            staffWorkload.length
                        )
                      : 0}
                  </p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-secondary flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-secondary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* View Toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={workflowView === 'unassigned' ? 'default' : 'outline'}
          size="sm"
          className="text-xs sm:text-sm"
          onClick={() => setWorkflowView('unassigned')}
        >
          <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          <span className="hidden xs:inline">Queue</span> ({unassignedTickets.length})
        </Button>
        <Button
          variant={workflowView === 'workload' ? 'default' : 'outline'}
          size="sm"
          className="text-xs sm:text-sm"
          onClick={() => setWorkflowView('workload')}
        >
          <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          Workload
        </Button>
        <Button
          variant={workflowView === 'history' ? 'default' : 'outline'}
          size="sm"
          className="text-xs sm:text-sm"
          onClick={() => setWorkflowView('history')}
        >
          <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          History
        </Button>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {workflowView === 'unassigned' && (
          <motion.div
            key="unassigned"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Bulk Actions */}
            {unassignedTickets.length > 0 && (
              <Card>
                <CardContent className="p-2 sm:py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={
                          selectedTickets.size === unassignedTickets.length &&
                          unassignedTickets.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {selectedTickets.size > 0
                          ? `${selectedTickets.size} selected`
                          : 'Select all'}
                      </span>
                    </div>
                    {selectedTickets.size > 0 && (
                      <Button onClick={() => setBulkAssignOpen(true)} size="sm" className="w-full sm:w-auto">
                        <Zap className="h-4 w-4 mr-2" />
                        Assign {selectedTickets.size} Ticket{selectedTickets.size > 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Unassigned Tickets List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Assignment Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                {unassignedTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-3" />
                    <p className="text-lg font-medium">All tickets assigned!</p>
                    <p className="text-sm text-muted-foreground">
                      Great job! No tickets are waiting for assignment.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="flex flex-col gap-3 pr-4">
                      {unassignedTickets.map((ticket: Ticket, index: number) => (
                        <motion.div
                          key={ticket.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className={`p-3 sm:p-4 rounded-lg border transition-colors ${
                            selectedTickets.has(ticket.id)
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-muted-foreground/30'
                          }`}
                        >
                          <div className="flex flex-col gap-3">
                            {/* Top row: checkbox + ticket info */}
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedTickets.has(ticket.id)}
                                onCheckedChange={() => handleSelectTicket(ticket.id)}
                                className="mt-1 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                                  {ticket.ticketNumber && (
                                    <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                      {ticket.ticketNumber}
                                    </span>
                                  )}
                                  <Badge className={`${PRIORITY_CONFIG[ticket.priorityKey].badgeClass} text-xs`}>
                                    {PRIORITY_CONFIG[ticket.priorityKey].label}
                                  </Badge>
                                </div>
                                <p className="font-medium text-sm sm:text-base truncate">{ticket.title}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                  {ticket.mainCategory} • {ticket.createdBy}
                                </p>
                              </div>
                            </div>
                            {/* Bottom row: assign dropdown - full width on mobile */}
                            <div className="flex justify-end pl-8 sm:pl-0">
                              <Select
                                onValueChange={(val: string) => handleQuickAssign(ticket.id, val)}
                              >
                                <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
                                  <SelectValue placeholder="Assign to..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {staffWorkload.map((staff: StaffWorkload) => (
                                    <SelectItem key={staff.email} value={staff.name}>
                                      <div className="flex items-center gap-2">
                                        <span>{staff.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          ({staff.assignedCount})
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {workflowView === 'workload' && (
          <motion.div
            key="workload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Staff Workload Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {staffWorkload.map((staff: StaffWorkload, index: number) => {
                const workloadLevel = getWorkloadLevel(staff.assignedCount);
                return (
                  <motion.div
                    key={staff.email}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden">
                      <div className={`h-1 ${getWorkloadColor(workloadLevel)}`} />
                      <CardContent className="p-3 md:pt-4">
                        <div className="flex items-center gap-3 mb-3 md:mb-4">
                          <Avatar className="h-10 w-10 md:h-12 md:w-12">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                              {getInitials(staff.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm md:text-base truncate">{staff.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{staff.email}</p>
                          </div>
                        </div>

                        <div className="space-y-2 md:space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-xs md:text-sm mb-1">
                              <span className="text-muted-foreground">Active</span>
                              <span className="font-medium">{staff.openCount}</span>
                            </div>
                            <Progress value={Math.min(staff.openCount * 10, 100)} className="h-1.5 md:h-2" />
                          </div>

                          <div className="flex items-center justify-between text-xs md:text-sm">
                            <span className="text-muted-foreground">Total</span>
                            <span className="font-medium">{staff.assignedCount}</span>
                          </div>

                          <Separator />

                          <div className="flex flex-wrap items-center gap-1">
                            {staff.criticalCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {staff.criticalCount} Critical
                              </Badge>
                            )}
                            {staff.highCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {staff.highCount} High
                              </Badge>
                            )}
                            {staff.criticalCount === 0 && staff.highCount === 0 && (
                              <span className="text-xs text-muted-foreground">No urgent</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {workflowView === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Recent Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignmentHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-lg font-medium">No assignment history</p>
                    <p className="text-sm text-muted-foreground">
                      Assignment changes will appear here.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {assignmentHistory.map((history: AssignmentHistory, index: number) => {
                        const ticketData = tickets.find((t: Ticket) => t.id === history.ticket.id);
                        return (
                          <motion.div
                            key={history.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                            className="p-4 rounded-lg border hover:border-muted-foreground/30 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <ArrowRightLeft className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {ticketData?.ticketNumber && (
                                    <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                      {ticketData.ticketNumber}
                                    </span>
                                  )}
                                  <span className="text-sm font-medium truncate">
                                    {ticketData?.title || 'Unknown Ticket'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  {history.previousAssignee ? (
                                    <>
                                      <span className="text-muted-foreground">
                                        {history.previousAssignee}
                                      </span>
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium text-primary">
                                        {history.assignedTo}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-muted-foreground">Assigned to</span>
                                      <span className="font-medium text-primary">
                                        {history.assignedTo}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {history.notes && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {history.notes}
                                  </p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(history.assignedDate)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  by {history.assignedBy}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Assign Dialog */}
      <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Bulk Assignment
            </DialogTitle>
            <DialogDescription>
              Assign {selectedTickets.size} ticket{selectedTickets.size > 1 ? 's' : ''} to a staff
              member.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To</label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {staffWorkload.map((staff: StaffWorkload) => (
                    <SelectItem key={staff.email} value={staff.name}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{staff.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {staff.assignedCount} assigned
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {getSuggestedAssignee() && !selectedAssignee && (
              <div className="p-3 rounded-lg bg-accent">
                <p className="text-sm text-accent-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Suggested: <strong>{getSuggestedAssignee()}</strong> (lowest workload)
                </p>
              </div>
            )}

            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">Selected Tickets:</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedTickets)
                  .slice(0, 5)
                  .map((id: string) => {
                    const ticket = tickets.find((t: Ticket) => t.id === id);
                    return ticket?.ticketNumber ? (
                      <Badge key={id} variant="outline" className="text-xs">
                        {ticket.ticketNumber}
                      </Badge>
                    ) : null;
                  })}
                {selectedTickets.size > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedTickets.size - 5} more
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={!selectedAssignee || isAssigning}
            >
              {isAssigning ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Assign All
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
