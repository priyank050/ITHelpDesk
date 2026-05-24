import { useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  Paperclip,
  AlertTriangle,
  Send,
  MessageSquare,
  ExternalLink,
  Eye,
  EyeOff,
  Hash,
  Mail,
  Phone,
  CheckCircle,
  Circle,
  Loader2,
  Sparkles,
  Share2,
  MoreHorizontal,
  Copy,
  Flag,
  UserCog,
  Layers,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Textarea } from './components/ui/textarea';
import { Label } from './components/ui/label';
import { Checkbox } from './components/ui/checkbox';
import { Separator } from './components/ui/separator';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './components/ui/dropdown-menu';
import { InMemoryDataBanner } from './generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from './generated/hooks';
import { useTicket, useUpdateTicket } from './generated/hooks/use-ticket';
import { useCommentList, useCreateComment } from './generated/hooks/use-comment';
import { useUser } from './hooks/use-user';
import type { Ticket, TicketStatusKey } from './generated/models/ticket-model';
import type { Comment } from './generated/models/comment-model';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  isTicketOverdue,
  formatDateTime,
  getTimeAgo,
} from './lib/ticket-utils';
import { CATEGORY_ICONS } from './lib/category-data';
import { IT_STAFF_NAMES } from './lib/admin-config';

interface CommentFormData {
  content: string;
  isInternal: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
} as const;

export default function TicketDetailsPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const id = paramId || queryId || '';
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { data: ticket, isLoading: ticketLoading } = useTicket(id);
  const { data: allComments = [], isLoading: commentsLoading } = useCommentList();
  const updateTicket = useUpdateTicket();
  const createComment = useCreateComment();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ticketComments = allComments
    .filter((c: Comment) => c.ticket?.id === id)
    .sort((a: Comment, b: Comment) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());

  const { register, handleSubmit, reset, watch, setValue } = useForm<CommentFormData>({
    defaultValues: {
      content: '',
      isInternal: false,
    },
  });

  const isInternal = watch('isInternal');

  const onSubmitComment = async (data: CommentFormData) => {
    if (!data.content.trim() || !id) return;

    setIsSubmitting(true);
    try {
      await createComment.mutateAsync({
        ticket: { id, ticketNumber: ticket?.ticketNumber || '' },
        author: user?.fullName || 'Anonymous',
        content: data.content,
        commentText: data.content.substring(0, 50),
        createdDate: new Date().toISOString(),
        isInternalNote: data.isInternal,
      });
      toast.success('Comment added successfully');
      reset();
    } catch (error: unknown) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatusKey) => {
    if (!id) return;
    try {
      await updateTicket.mutateAsync({
        id,
        changedFields: { statusKey: newStatus },
      });
      toast.success('Status updated successfully');
    } catch (error: unknown) {
      toast.error('Failed to update status');
    }
  };

  const handleAssigneeChange = async (assignee: string) => {
    if (!id || assignee === 'unassigned') return;
    try {
      await updateTicket.mutateAsync({
        id,
        changedFields: {
          assignedTo: assignee,
          statusKey: ticket?.statusKey === 'StatusKey0' ? 'StatusKey1' : ticket?.statusKey,
        },
      });
      toast.success(`Assigned to ${assignee}`);
    } catch (error: unknown) {
      toast.error('Failed to assign ticket');
    }
  };

  const handleCopyTicketId = () => {
    if (ticket?.ticketNumber) {
      navigator.clipboard.writeText(ticket.ticketNumber);
      toast.success('Ticket ID copied!');
    }
  };

  const handleShareTicket = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Ticket link copied to clipboard!');
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleReportIssue = () => {
    toast.info('Issue reported to administrator');
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (ticketLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto" aria-hidden="true">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
          <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="h-32 bg-muted animate-pulse rounded-xl" />
            <div className="h-40 bg-muted animate-pulse rounded-xl" />
          </div>
          <div className="lg:col-span-3 space-y-6">
            <div className="h-48 bg-muted animate-pulse rounded-2xl" />
            <div className="h-64 bg-muted animate-pulse rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6 lg:p-8">
        <Button variant="ghost" onClick={() => navigate('/my-tickets')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Tickets
        </Button>
        <Card className="p-12 text-center max-w-md mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Ticket Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested ticket could not be found or may have been deleted.</p>
          <Button asChild>
            <Link to="/all-tickets">View All Tickets</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const overdue = isTicketOverdue(ticket);

  // Status timeline steps
  const statusSteps = [
    { key: 'StatusKey0', label: 'Open', icon: Circle },
    { key: 'StatusKey1', label: 'In Progress', icon: Loader2 },
    { key: 'StatusKey2', label: 'Resolved', icon: CheckCircle },
    { key: 'StatusKey3', label: 'Closed', icon: CheckCircle },
  ];

  const currentStatusIndex = statusSteps.findIndex((s: { key: string }) => s.key === ticket.statusKey);

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-7xl mx-auto">
      <InMemoryDataBanner
        show={HAS_IN_MEMORY_TABLES}
        message="This app uses draft tables for testing. Data entered won't be saved."
        className="bg-accent text-accent-foreground"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-tickets')} className="-ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyTicketId}>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copy ID
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon-sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleOpenInNewTab}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in new tab
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleReportIssue} className="text-destructive">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report issue
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {ticket.ticketNumber && (
              <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                #{ticket.ticketNumber}
              </span>
            )}
            <Badge className={`${PRIORITY_CONFIG[ticket.priorityKey].badgeClass} text-xs`}>
              {PRIORITY_CONFIG[ticket.priorityKey].label}
            </Badge>
            <Badge variant="outline" className={`${STATUS_CONFIG[ticket.statusKey].className} text-xs`}>
              {STATUS_CONFIG[ticket.statusKey].label}
            </Badge>
            {overdue && (
              <Badge className="bg-destructive text-destructive-foreground text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">{ticket.title}</h1>
        </motion.div>

        {/* Status Timeline - Compact */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-none shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                {statusSteps.map((step: { key: string; label: string; icon: typeof Circle }, index: number) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  
                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                            isCurrent
                              ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                              : isCompleted
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isCurrent && step.key === 'StatusKey1' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Icon className={`h-4 w-4 ${isCompleted ? 'fill-current' : ''}`} />
                          )}
                        </div>
                        <span className={`text-[10px] mt-1 font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                          index < currentStatusIndex ? 'bg-primary' : 'bg-muted'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-4">
          {/* Sidebar Cards - 3x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-sm h-full">
                <CardContent className="p-3">
                  <h3 className="font-semibold text-xs mb-2 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                    <UserCog className="h-3.5 w-3.5" />
                    Actions
                  </h3>
                  <div className="space-y-2">
                    <Select value={ticket.statusKey} onValueChange={handleStatusChange}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(STATUS_CONFIG) as [TicketStatusKey, { label: string }][]).map(
                          ([key, config]: [TicketStatusKey, { label: string }]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <Select value={ticket.assignedTo || 'unassigned'} onValueChange={handleAssigneeChange}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned" disabled>Unassigned</SelectItem>
                        {IT_STAFF_NAMES.map((staff: string) => (
                          <SelectItem key={staff} value={staff}>{staff}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Requester */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-sm h-full">
                <CardContent className="p-3">
                  <h3 className="font-semibold text-xs mb-2 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                    <User className="h-3.5 w-3.5" />
                    Requester
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold">
                        {getInitials(ticket.createdBy)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{ticket.createdBy}</p>
                      {ticket.raisedByName && (
                        <p className="text-[10px] text-muted-foreground">@{ticket.raisedByName}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    {ticket.requesterEmail && (
                      <a href={`mailto:${ticket.requesterEmail}`} className="flex items-center gap-1.5 p-1 rounded hover:bg-muted/50 transition-colors truncate">
                        <Mail className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate">{ticket.requesterEmail}</span>
                      </a>
                    )}
                    {ticket.mobileNumber && (
                      <a href={`tel:${ticket.mobileNumber}`} className="flex items-center gap-1.5 p-1 rounded hover:bg-muted/50 transition-colors">
                        <Phone className="h-3 w-3 text-primary shrink-0" />
                        <span>{ticket.mobileNumber}</span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Organization */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-sm h-full">
                <CardContent className="p-3">
                  <h3 className="font-semibold text-xs mb-2 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                    <Layers className="h-3.5 w-3.5" />
                    Organization
                  </h3>
                  <div className="space-y-2 text-xs">
                    {ticket.company && (
                      <div className="p-2 rounded bg-muted/30">
                        <p className="text-[10px] text-muted-foreground uppercase">Company</p>
                        <p className="font-medium truncate">{ticket.company.name1}</p>
                      </div>
                    )}
                    {ticket.department && (
                      <div className="p-2 rounded bg-muted/30">
                        <p className="text-[10px] text-muted-foreground uppercase">Department</p>
                        <p className="font-medium truncate">{ticket.department.name1}</p>
                      </div>
                    )}
                    {!ticket.company && !ticket.department && (
                      <p className="text-muted-foreground text-xs">No organization info</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Category */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-sm h-full">
                <CardContent className="p-3">
                  <h3 className="font-semibold text-xs mb-2 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                    <Flag className="h-3.5 w-3.5" />
                    Category
                  </h3>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 p-1.5 rounded bg-primary/10 text-primary">
                      <span className="text-sm">{CATEGORY_ICONS[ticket.mainCategory] || '📁'}</span>
                      <span className="font-semibold truncate">{ticket.mainCategory}</span>
                    </div>
                    {ticket.subcategory && (
                      <div className="flex items-center gap-1.5 p-1.5 rounded bg-muted/50 ml-2">
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{ticket.subcategory}</span>
                      </div>
                    )}
                    {ticket.itemDetail && (
                      <div className="flex items-center gap-1.5 p-1.5 rounded bg-muted/30 ml-4">
                        <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{ticket.itemDetail}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Timeline */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-sm h-full">
                <CardContent className="p-3">
                  <h3 className="font-semibold text-xs mb-2 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5" />
                    Timeline
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground">Created</p>
                        <p className="font-semibold truncate">{formatDateTime(ticket.createdDate)}</p>
                      </div>
                    </div>
                    {ticket.sLADueDate && (
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${overdue ? 'bg-destructive animate-pulse' : 'bg-amber-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-[10px] ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>SLA Due {overdue && '⚠️'}</p>
                          <p className={`font-semibold truncate ${overdue ? 'text-destructive' : ''}`}>{formatDateTime(ticket.sLADueDate)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Assignment */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-sm h-full">
                <CardContent className="p-3">
                  <h3 className="font-semibold text-xs mb-2 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                    <UserCog className="h-3.5 w-3.5" />
                    Assignment
                  </h3>
                  {ticket.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">
                          {getInitials(ticket.assignedTo)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{ticket.assignedTo}</p>
                        <p className="text-[10px] text-muted-foreground">IT Support</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="text-xs">Unassigned</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content - Description & Comments */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Description */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{ticket.description}</p>
                  {ticket.attachmentURL && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <a
                        href={ticket.attachmentURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-xs"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-primary" />
                        <span>View Attachment</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Comments */}
            <motion.div variants={itemVariants}>
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Comments
                    </span>
                    <Badge variant="secondary" className="text-[10px]">{ticketComments.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-4">
                  {commentsLoading ? (
                    <div className="space-y-2" aria-hidden="true">
                      {[1, 2].map((i: number) => (
                        <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : ticketComments.length === 0 ? (
                    <div className="text-center py-6">
                      <MessageSquare className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">No comments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {ticketComments.map((comment: Comment, index: number) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`p-2.5 rounded-lg ${
                            comment.isInternalNote
                              ? 'bg-amber-500/5 border border-amber-500/20'
                              : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarFallback className={`text-[9px] font-semibold ${
                                comment.isInternalNote ? 'bg-amber-500/20 text-amber-700' : 'bg-primary/10 text-primary'
                              }`}>
                                {getInitials(comment.author)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-xs">{comment.author}</span>
                                  {comment.isInternalNote && (
                                    <Badge variant="outline" className="text-[8px] bg-amber-500/10 text-amber-600 border-amber-500/20 px-1 py-0">
                                      Internal
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[9px] text-muted-foreground">{getTimeAgo(comment.createdDate)}</span>
                              </div>
                              <p className="text-xs whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <form onSubmit={handleSubmit(onSubmitComment)} className="space-y-2">
                      <Textarea
                        placeholder="Write a comment..."
                        rows={1}
                        className="resize-none text-sm min-h-[40px]"
                        {...register('content')}
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Checkbox
                            id="internal"
                            checked={isInternal}
                            onCheckedChange={(checked: boolean) => setValue('isInternal', checked)}
                          />
                          <Label htmlFor="internal" className="text-[10px] cursor-pointer flex items-center gap-1">
                            {isInternal ? <EyeOff className="h-2.5 w-2.5 text-amber-600" /> : <Eye className="h-2.5 w-2.5" />}
                            Internal
                          </Label>
                        </div>
                        <Button type="submit" size="sm" disabled={isSubmitting} className="h-7 text-xs px-3">
                          {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                          <span className="ml-1">{isSubmitting ? 'Sending...' : 'Send'}</span>
                        </Button>
                      </div>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
