import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Send,
  Paperclip,
  ChevronRight,
  CheckCircle,
  Copy,
  ExternalLink,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  Flag,
  Layers,
  FileText,
  Bell,
  SendHorizontal,
  ImagePlus,
  X,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Label } from './components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Badge } from './components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './components/ui/dialog';
import { InMemoryDataBanner } from './generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from './generated/hooks';
import { useCreateTicket, CreateTicketSchema, useTicketList } from './generated/hooks/use-ticket';
import { useCompanyList } from './generated/hooks/use-company';
import { useDepartmentList } from './generated/hooks/use-department';
import type { Company } from './generated/models/company-model';
import type { Department } from './generated/models/department-model';
import { useUser } from './hooks/use-user';
import type { TicketPriorityKey } from './generated/models/ticket-model';
import { PRIORITY_CONFIG } from './lib/ticket-utils';
import { MAIN_CATEGORIES, getSubcategories, getItemDetails, CATEGORY_ICONS, generateTicketId } from './lib/category-data';
import { z } from 'zod';

const formSchema = CreateTicketSchema.pick({
  title: true,
  description: true,
}).extend({
  priorityKey: z.enum(['PriorityKey0', 'PriorityKey1', 'PriorityKey2', 'PriorityKey3'], { error: 'Select a priority' }),
  mainCategory: z.string().min(1, { error: 'Select a main category' }),
  subcategory: z.string().min(1, { error: 'Select a subcategory' }),
  itemDetail: z.string().min(1, { error: 'Select an item/detail' }),
  attachmentURL: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
} as const;

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const { data: user } = useUser();
  const createTicket = useCreateTicket();
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { data: companies = [] } = useCompanyList();
  const { data: departments = [] } = useDepartmentList();

  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [raisedByName, setRaisedByName] = useState('');
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [availableItemDetails, setAvailableItemDetails] = useState<string[]>([]);
  // Custom "Other" input states
  const [customMainCategory, setCustomMainCategory] = useState('');
  const [customSubcategory, setCustomSubcategory] = useState('');
  const [customItemDetail, setCustomItemDetail] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');

  // Get selected company data
  const selectedCompanyData = useMemo(() => 
    companies.find((c: Company) => c.name1 === company),
    [companies, company]
  );
  const companyPrefix = selectedCompanyData?.ticketPrefix || 'TKT';

  // Filter departments by selected company - MUST select company first
  const filteredDepartments = useMemo(() => {
    if (!selectedCompanyData) return [];
    return departments.filter((d: Department) => 
      d.company?.id === selectedCompanyData.id
    );
  }, [departments, selectedCompanyData]);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Current date/time - updates every second for display
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date and time for display
  const formattedDate = useMemo(() => format(currentTime, 'dd MMM yyyy'), [currentTime]);
  const formattedTime = useMemo(() => format(currentTime, 'HH:mm:ss'), [currentTime]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      mainCategory: '',
      subcategory: '',
      itemDetail: '',
      attachmentURL: '',
    },
  });

  const selectedPriority = watch('priorityKey');
  const selectedMainCategory = watch('mainCategory');
  const selectedSubcategory = watch('subcategory');
  const selectedItemDetail = watch('itemDetail');

  // Check if "Other" is selected
  const isOtherMainCategory = selectedMainCategory === '__other__';
  const isOtherSubcategory = selectedSubcategory === '__other__';
  const isOtherItemDetail = selectedItemDetail === '__other__';

  // Update subcategories when main category changes
  useEffect(() => {
    if (selectedMainCategory && selectedMainCategory !== '__other__') {
      const subs = getSubcategories(selectedMainCategory);
      setAvailableSubcategories(subs);
      setValue('subcategory', '');
      setValue('itemDetail', '');
      setAvailableItemDetails([]);
      setCustomSubcategory('');
      setCustomItemDetail('');
    } else if (selectedMainCategory === '__other__') {
      setAvailableSubcategories([]);
      setAvailableItemDetails([]);
      setValue('subcategory', '__other__');
      setValue('itemDetail', '__other__');
    } else {
      setAvailableSubcategories([]);
      setAvailableItemDetails([]);
    }
  }, [selectedMainCategory, setValue]);

  // Update item details when subcategory changes
  useEffect(() => {
    if (selectedMainCategory && selectedMainCategory !== '__other__' && selectedSubcategory && selectedSubcategory !== '__other__') {
      const items = getItemDetails(selectedMainCategory, selectedSubcategory);
      setAvailableItemDetails(items);
      setValue('itemDetail', '');
      setCustomItemDetail('');
    } else if (selectedSubcategory === '__other__') {
      setAvailableItemDetails([]);
      setValue('itemDetail', '__other__');
    } else {
      setAvailableItemDetails([]);
    }
  }, [selectedMainCategory, selectedSubcategory, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const now = new Date();
      const ticketId = generateTicketId(company);
      
      // Get selected company data for the ticket
      const companyData = companies.find((c: Company) => c.name1 === company);
      if (!companyData) {
        toast.error('Please select a company');
        return;
      }
      
      // Get selected department data (optional)
      const departmentData = departments.find((d: Department) => d.name1 === department);
      
      // SLA: Critical=4h, High=8h, Medium=24h, Low=48h
      const slaHours: Record<TicketPriorityKey, number> = {
        PriorityKey0: 48,
        PriorityKey1: 24,
        PriorityKey2: 8,
        PriorityKey3: 4,
      };
      const slaDueDate = new Date(now.getTime() + slaHours[data.priorityKey] * 60 * 60 * 1000);

      await createTicket.mutateAsync({
        ticketNumber: ticketId,
        title: data.title,
        description: data.description,
        priorityKey: data.priorityKey,
        mainCategory: isOtherMainCategory ? customMainCategory : data.mainCategory,
        subcategory: isOtherSubcategory ? customSubcategory : data.subcategory,
        itemDetail: isOtherItemDetail ? customItemDetail : data.itemDetail,
        statusKey: 'StatusKey0',
        createdBy: user?.fullName || 'Anonymous User',
        createdDate: now.toISOString(),
        sLADueDate: slaDueDate.toISOString(),
        attachmentURL: attachmentUrl || undefined,
        mobileNumber: mobileNumber || undefined,
        requesterEmail: user?.userPrincipalName || undefined,
        raisedByName: raisedByName || undefined,
        company: { id: companyData.id, name1: companyData.name1 },
        department: departmentData ? { id: departmentData.id, name1: departmentData.name1 } : undefined,
      });

      setSubmittedTicketId(ticketId);
      setShowSuccessDialog(true);
      
      // Auto-send email notification if enabled
      if (sendEmailNotification && emailRecipients.trim()) {
        await handleSendEmailNotification(ticketId, data);
      }
    } catch (error: unknown) {
      toast.error('Failed to create ticket');
    }
  };

  const handleCopyTicketId = () => {
    if (submittedTicketId) {
      navigator.clipboard.writeText(submittedTicketId);
      toast.success('Ticket ID copied to clipboard');
    }
  };

  const handleSendEmailNotification = async (ticketId: string, data: FormData) => {
    setEmailSending(true);
    try {
      // Simulate email sending (in real app, this would call an API)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const recipients = emailRecipients.split(',').map((e: string) => e.trim()).filter((e: string) => e);
      
      // Log the email that would be sent
      console.log('Email Notification:', {
        to: recipients,
        subject: `[${PRIORITY_CONFIG[data.priorityKey].label}] New Ticket: ${data.title}`,
        body: `A new support ticket has been created.\n\nTicket ID: ${ticketId}\nTitle: ${data.title}\nPriority: ${PRIORITY_CONFIG[data.priorityKey].label}\nCategory: ${data.mainCategory} > ${data.subcategory} > ${data.itemDetail}\nRequester: ${user?.fullName || 'Unknown'}\n\nDescription:\n${data.description}`,
      });
      
      setEmailSent(true);
      toast.success(`Email notification sent to ${recipients.length} recipient(s)`);
    } catch (error: unknown) {
      toast.error('Failed to send email notification');
    } finally {
      setEmailSending(false);
    }
  };

  const handleManualEmailSend = async () => {
    if (!submittedTicketId || !emailRecipients.trim()) {
      toast.error('Please enter at least one email recipient');
      return;
    }
    
    const formData = {
      title: watch('title'),
      description: watch('description'),
      priorityKey: watch('priorityKey'),
      mainCategory: watch('mainCategory'),
      subcategory: watch('subcategory'),
      itemDetail: watch('itemDetail'),
    } as FormData;
    
    await handleSendEmailNotification(submittedTicketId, formData);
  };

  // Handle image upload
  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    const newImages: { file: File; preview: string }[] = [];
    Array.from(files).forEach((file: File) => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        newImages.push({ file, preview });
      }
    });
    setUploadedImages((prev: { file: File; preview: string }[]) => [...prev, ...newImages].slice(0, 5));
    if (newImages.length > 0) {
      toast.success(`${newImages.length} image(s) added`);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev: { file: File; preview: string }[]) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files);
  };

  const handleCreateAnother = () => {
    setShowSuccessDialog(false);
    setSubmittedTicketId(null);
    window.location.reload();
  };

  // Priority card styles
  const priorityStyles: Record<string, { bg: string; border: string; icon: string }> = {
    PriorityKey0: { bg: 'bg-green-500/5', border: 'border-green-500/20', icon: 'text-green-600' },
    PriorityKey1: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: 'text-amber-600' },
    PriorityKey2: { bg: 'bg-orange-500/5', border: 'border-orange-500/20', icon: 'text-orange-600' },
    PriorityKey3: { bg: 'bg-destructive/5', border: 'border-destructive/20', icon: 'text-destructive' },
  };

  return (
    <>
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5, delay: 0.1 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
            >
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </motion.div>
            <DialogTitle className="text-center text-xl">Ticket Submitted Successfully!</DialogTitle>
            <DialogDescription className="text-center">
              Your support request has been created and assigned a unique ticket ID.
            </DialogDescription>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 space-y-4"
          >
            {/* Ticket ID Display */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 text-center border border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">Your Ticket ID</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold text-primary tracking-wide">{submittedTicketId}</span>
                <Button variant="ghost" size="icon" onClick={handleCopyTicketId} className="h-8 w-8 hover:bg-primary/10">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Save this ID to track your ticket status
              </p>
            </div>

            {/* Manual Email Send Section */}
            <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium">Send Email Notification</span>
                </div>
                {emailSent && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Sent
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email recipients..."
                  value={emailRecipients}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailRecipients(e.target.value)}
                  className="flex-1 bg-background text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleManualEmailSend}
                  disabled={emailSending || !emailRecipients.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {emailSending ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <SendHorizontal className="h-4 w-4 mr-1" />
                      Send
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Manually send ticket details to additional recipients
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/my-tickets')} className="w-full shadow-lg shadow-primary/20">
                <ExternalLink className="h-4 w-4 mr-2" />
                View My Tickets
              </Button>
              <Button variant="outline" onClick={handleCreateAnother} className="w-full">
                Create Another Ticket
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <InMemoryDataBanner
          show={HAS_IN_MEMORY_TABLES}
          message="This app uses draft tables for testing. Data entered won't be saved."
          className="bg-accent text-accent-foreground mb-6"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Create New Ticket</h1>
              <p className="text-muted-foreground">Submit a support request to the IT team</p>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div variants={itemVariants}>
            <Card className="hover-lift">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Ticket Details</CardTitle>
                    <CardDescription>Provide information about your issue</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Requester Information Section */}
                  <div className="bg-gradient-to-br from-muted/50 to-muted/30 border rounded-xl p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Requester Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Date - Read Only */}
                      <div className="space-y-2">
                        <Label className="select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex items-center gap-2 text-sm text-muted-foreground font-bold">
                          <Calendar className="h-3.5 w-3.5" />
                          Date
                        </Label>
                        <div className="bg-background border border-input rounded-lg px-4 py-2.5 text-sm font-mono cursor-not-allowed select-none flex items-center justify-between">
                          {formattedDate}
                          <Badge variant="outline" className="text-xs">Auto</Badge>
                        </div>
                      </div>
                      
                      {/* Time - Read Only */}
                      <div className="space-y-2">
                        <Label className="select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex items-center gap-2 text-sm text-muted-foreground font-bold">
                          <Clock className="h-3.5 w-3.5" />
                          Time
                        </Label>
                        <div className="bg-background border border-input rounded-lg px-4 py-2.5 text-sm font-mono cursor-not-allowed select-none flex items-center justify-between">
                          {formattedTime}
                          <Badge variant="outline" className="text-xs">Auto</Badge>
                        </div>
                      </div>
                      
                      {/* Name - Read Only */}
                      <div className="space-y-2">
                        <Label className="select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex items-center gap-2 text-sm text-muted-foreground font-bold">
                          <User className="h-3.5 w-3.5" />
                          Full Name
                        </Label>
                        <div className="bg-background border border-input rounded-lg px-4 py-2.5 text-sm cursor-not-allowed select-none truncate">
                          {user?.fullName || 'Loading...'}
                        </div>
                      </div>
                      
                      {/* Email - Read Only */}
                      <div className="space-y-2">
                        <Label className="select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex items-center gap-2 text-sm text-muted-foreground font-bold">
                          <Mail className="h-3.5 w-3.5" />
                          Email
                        </Label>
                        <div className="bg-background border border-input rounded-lg px-4 py-2.5 text-sm cursor-not-allowed select-none truncate">
                          {user?.userPrincipalName || 'Loading...'}
                        </div>
                      </div>
                      
                      {/* Raised By Name (Short Name) - Editable */}
                      <div className="space-y-2">
                        <Label htmlFor="raisedByName" className="select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex items-center gap-2 text-sm font-bold">
                          <User className="h-3.5 w-3.5" />
                          Short Name / Nickname
                        </Label>
                        <Input
                          id="raisedByName"
                          placeholder="Enter short name"
                          value={raisedByName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRaisedByName(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      
                      {/* Company - Dropdown (Select first) */}
                      <div className="space-y-2">
                        <Label htmlFor="company" className="select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex items-center gap-2 text-sm font-bold">
                          <Layers className="h-3.5 w-3.5" />
                          Company *
                        </Label>
                        <Select value={company} onValueChange={(val: string) => {
                          setCompany(val);
                          setDepartment(''); // Reset department when company changes
                        }}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select company first" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.filter((c: Company) => c.id).map((comp: Company) => (
                              <SelectItem key={comp.id} value={comp.name1}>
                                <span className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs font-mono">{comp.ticketPrefix}</Badge>
                                  {comp.name1}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Department - Dropdown (filtered by company) */}
                      <div className="space-y-2">
                        <Label htmlFor="department" className="select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex items-center gap-2 text-sm font-bold">
                          <Layers className="h-3.5 w-3.5" />
                          Department *
                        </Label>
                        <Select 
                          value={department} 
                          onValueChange={setDepartment}
                          disabled={!company}
                        >
                          <SelectTrigger className={`bg-background ${!company ? 'opacity-50' : ''}`}>
                            <SelectValue placeholder={company ? 'Select department' : 'Select company first'} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredDepartments.filter((d: Department) => d.id).map((dept: Department) => (
                              <SelectItem key={dept.id} value={dept.name1}>
                                {dept.name1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {company && filteredDepartments.length === 0 && (
                          <p className="text-xs text-muted-foreground">No departments found for this company</p>
                        )}
                      </div>
                      
                      {/* Mobile Number - Editable */}
                      <div className="space-y-2">
                        <Label htmlFor="mobile" className="select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 flex items-center gap-2 text-sm font-bold">
                          <Phone className="h-3.5 w-3.5" />
                          Mobile Number (optional)
                        </Label>
                        <Input
                          id="mobile"
                          placeholder="+1 555-123-4567"
                          value={mobileNumber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMobileNumber(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Issue Details Section */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 font-bold text-base">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Brief summary of the issue"
                        className="bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
                        {...register('title')}
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-base font-bold">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, and what you've already tried..."
                        rows={5}
                        className="bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors resize-none"
                        {...register('description')}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {errors.description.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" />
                      <Label className="flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-base font-bold">Category *</Label>
                    </div>
                    
                    {/* Category Breadcrumb */}
                    {(selectedMainCategory || selectedSubcategory || selectedItemDetail) && (
                      <div className="flex items-center gap-1.5 text-sm bg-primary/5 border border-primary/20 px-4 py-2.5 rounded-lg flex-wrap">
                        {selectedMainCategory && (
                          <>
                            <span className="text-lg">{isOtherMainCategory ? '✏️' : CATEGORY_ICONS[selectedMainCategory]}</span>
                            <span className="font-medium">{isOtherMainCategory ? (customMainCategory || 'Custom Category') : selectedMainCategory}</span>
                          </>
                        )}
                        {selectedSubcategory && (
                          <>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <span>{isOtherSubcategory ? (customSubcategory || 'Custom Subcategory') : selectedSubcategory}</span>
                          </>
                        )}
                        {selectedItemDetail && (
                          <>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-primary">{isOtherItemDetail ? (customItemDetail || 'Custom Detail') : selectedItemDetail}</span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="grid gap-4">
                      {/* Main Category */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Main Category</Label>
                        <Select
                          value={selectedMainCategory}
                          onValueChange={(val: string) => setValue('mainCategory', val)}
                        >
                          <SelectTrigger className="bg-muted/50 border-transparent">
                            <SelectValue placeholder="Select main category" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {MAIN_CATEGORIES.map((cat: string) => (
                              <SelectItem key={cat} value={cat}>
                                <span className="flex items-center gap-2">
                                  <span>{CATEGORY_ICONS[cat]}</span>
                                  {cat}
                                </span>
                              </SelectItem>
                            ))}
                            <div className="border-t border-border my-1" />
                            <SelectItem value="__other__" className="text-primary font-medium">
                              <span className="flex items-center gap-2">
                                <span>✏️</span>
                                Other - Not in list (Enter manually)
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {isOtherMainCategory && (
                          <Input
                            placeholder="Enter custom category..."
                            value={customMainCategory}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomMainCategory(e.target.value)}
                            className="bg-background border-primary/30 focus:border-primary mt-2"
                          />
                        )}
                        {errors.mainCategory && (
                          <p className="text-sm text-destructive flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {errors.mainCategory.message}
                          </p>
                        )}
                      </div>

                      {/* Subcategory */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-muted-foreground text-base font-bold">Subcategory</Label>
                        {isOtherMainCategory ? (
                          <Input
                            placeholder="Enter custom subcategory..."
                            value={customSubcategory}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomSubcategory(e.target.value)}
                            className="bg-muted/50 border-transparent focus:border-primary focus:bg-background"
                          />
                        ) : (
                          <>
                            <Select
                              value={selectedSubcategory}
                              onValueChange={(val: string) => setValue('subcategory', val)}
                              disabled={!selectedMainCategory || availableSubcategories.length === 0}
                            >
                              <SelectTrigger className="bg-muted/50 border-transparent">
                                <SelectValue placeholder={selectedMainCategory ? 'Select subcategory' : 'Select main category first'} />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {availableSubcategories.map((sub: string) => (
                                  <SelectItem key={sub} value={sub}>
                                    {sub}
                                  </SelectItem>
                                ))}
                                <div className="border-t border-border my-1" />
                                <SelectItem value="__other__" className="text-primary font-medium">
                                  <span className="flex items-center gap-2">
                                    <span>✏️</span>
                                    Other - Not in list (Enter manually)
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {isOtherSubcategory && (
                              <Input
                                placeholder="Enter custom subcategory..."
                                value={customSubcategory}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomSubcategory(e.target.value)}
                                className="bg-background border-primary/30 focus:border-primary mt-2"
                              />
                            )}
                          </>
                        )}
                        {errors.subcategory && (
                          <p className="text-sm text-destructive flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {errors.subcategory.message}
                          </p>
                        )}
                      </div>

                      {/* Item/Detail */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-muted-foreground text-base font-bold">Item / Detail</Label>
                        {isOtherMainCategory || isOtherSubcategory ? (
                          <Input
                            placeholder="Enter custom item/detail..."
                            value={customItemDetail}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomItemDetail(e.target.value)}
                            className="bg-muted/50 border-transparent focus:border-primary focus:bg-background"
                          />
                        ) : (
                          <>
                            <Select
                              value={selectedItemDetail}
                              onValueChange={(val: string) => setValue('itemDetail', val)}
                              disabled={!selectedSubcategory || availableItemDetails.length === 0}
                            >
                              <SelectTrigger className="bg-muted/50 border-transparent">
                                <SelectValue placeholder={selectedSubcategory ? 'Select item/detail' : 'Select subcategory first'} />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {availableItemDetails.map((item: string) => (
                                  <SelectItem key={item} value={item}>
                                    {item}
                                  </SelectItem>
                                ))}
                                <div className="border-t border-border my-1" />
                                <SelectItem value="__other__" className="text-primary font-medium">
                                  <span className="flex items-center gap-2">
                                    <span>✏️</span>
                                    Other - Not in list (Enter manually)
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {isOtherItemDetail && (
                              <Input
                                placeholder="Enter custom item/detail..."
                                value={customItemDetail}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomItemDetail(e.target.value)}
                                className="bg-background border-primary/30 focus:border-primary mt-2"
                              />
                            )}
                          </>
                        )}
                        {errors.itemDetail && (
                          <p className="text-sm text-destructive flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {errors.itemDetail.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Priority Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Flag className="h-5 w-5 text-primary" />
                      <Label className="flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-xl font-bold">Priority *</Label>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(Object.entries(PRIORITY_CONFIG) as [TicketPriorityKey, { label: string; slaHours: number }][]).map(
                        ([key, config]: [TicketPriorityKey, { label: string; slaHours: number }]) => {
                          const isSelected = selectedPriority === key;
                          const style = priorityStyles[key];
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setValue('priorityKey', key)}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                isSelected
                                  ? `${style.bg} ${style.border} ring-2 ring-offset-2 ring-primary/20`
                                  : 'bg-card border-border hover:border-primary/30'
                              }`}
                            >
                              <div className={`font-semibold text-sm ${isSelected ? style.icon : ''}`}>
                                {config.label}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                SLA: {config.slaHours}h
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                    {errors.priorityKey && (
                      <p className="text-sm text-destructive flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.priorityKey.message}
                      </p>
                    )}
                  </div>

                  {/* Email Notification Section */}
                  <div className="space-y-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <Label className="flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 text-base font-bold">Email Notification</Label>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm text-muted-foreground">
                          {sendEmailNotification ? 'Enabled' : 'Disabled'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSendEmailNotification(!sendEmailNotification)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            sendEmailNotification ? 'bg-blue-600' : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                              sendEmailNotification ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </label>
                    </div>
                    
                    {sendEmailNotification && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="emailRecipients" className="text-sm text-muted-foreground">
                            Recipients (comma-separated emails)
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="emailRecipients"
                              placeholder="admin@company.com, support@company.com"
                              value={emailRecipients}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailRecipients(e.target.value)}
                              className="pl-10 bg-background"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          Email will be sent automatically when ticket is submitted
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Attachments Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ImagePlus className="h-5 w-5 text-primary" />
                      <Label className="flex items-center gap-2 select-none text-base font-bold">
                        Attachments (optional)
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {uploadedImages.length}/5 images
                      </span>
                    </div>

                    {/* Image Upload Drop Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                        isDragging
                          ? 'border-primary bg-primary/5 scale-[1.02]'
                          : 'border-border hover:border-primary/50 hover:bg-muted/30'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleImageUpload(e.target.files)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadedImages.length >= 5}
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className={`p-3 rounded-full ${isDragging ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Upload className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {isDragging ? 'Drop images here' : 'Drag & drop images or click to upload'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, GIF up to 10MB each (max 5 images)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Image Previews */}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {uploadedImages.map((img: { file: File; preview: string }, index: number) => (
                          <div
                            key={img.preview}
                            className="relative group aspect-square rounded-lg overflow-hidden border bg-muted"
                          >
                            <img
                              src={img.preview}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRemoveImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <p className="text-white text-xs truncate">{img.file.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* URL Input (Alternative) */}
                    <div className="space-y-2">
                      <Label htmlFor="attachment" className="text-sm text-muted-foreground flex items-center gap-2">
                        <Paperclip className="h-3.5 w-3.5" />
                        Or paste an attachment URL
                      </Label>
                      <Input
                        id="attachment"
                        placeholder="https://..."
                        value={attachmentUrl}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAttachmentUrl(e.target.value)}
                        className="bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-colors"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1 shadow-lg shadow-primary/20">
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 mr-2 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Ticket
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
