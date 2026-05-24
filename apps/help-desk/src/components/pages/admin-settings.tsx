import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Users,
  Plus,
  Trash2,
  Save,
  UserCog,
  Mail,
  User,
  CheckCircle,
  AlertTriangle,
  Search,
  Crown,
  Settings,
  Lock,
  Sparkles,
  Upload,
  Image,
  X,
  RotateCcw,
  Building2,
  Download,
  FileSpreadsheet,
  FileUp,
  FileDown,
  Database,
  AlertCircle,
  Check,
  Eye,
  Link,
  ExternalLink,
  Server,
  Table2,
  HardDrive,
  Copy,
  RefreshCw,

} from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './components/ui/collapsible';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';
import { TableSchemaViewer } from './components/table-schema-viewer';
import { toast } from 'sonner';
import { useUser } from './hooks/use-user';
import { isAdmin, COMPANIES } from './lib/admin-config';
import { useLogoStorage } from './hooks/use-logo-storage';
import { useTicketList, useCompanyList, useDepartmentList } from './generated/hooks';
import {
  getSampleTicketsCSV,
  getSampleCompaniesCSV,
  getSampleDepartmentsCSV,
  exportTicketsToCSV,
  exportCompaniesToCSV,
  exportDepartmentsToCSV,
  downloadCSV,
  parseCSV,
  validateTicketImport,
  validateCompanyImport,
  validateDepartmentImport,
} from './lib/import-export-service';

interface UserEntry {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'it-support' | 'employee';
  addedDate: Date;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
} as const;

export default function AdminSettingsPage() {
  const { data: currentUser } = useUser();
  const userEmail = currentUser?.userPrincipalName || '';
  const isUserAdmin = isAdmin(userEmail);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('branding');
  
  // Logo upload refs
  const primaryLogoRef = useRef<HTMLInputElement>(null);
  const secondaryLogoRef = useRef<HTMLInputElement>(null);
  
  // Logo storage hook
  const { logos, saveLogo, removeLogo, resetLogos, fileToDataUrl } = useLogoStorage();

  // Data hooks for import/export
  const { data: tickets = [] } = useTicketList();
  const { data: companies = [] } = useCompanyList();


  const { data: departments = [] } = useDepartmentList();

  // Import/Export states
  const [importType, setImportType] = useState<'tickets' | 'companies' | 'departments'>('tickets');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string[][] | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  // State for users list
  const [users, setUsers] = useState<UserEntry[]>([
    {
      id: '1',
      name: 'Systems Admin',
      email: 'systems@atpigments.com',
      role: 'admin',
      addedDate: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Sarah Martinez',
      email: 'sarah.martinez@atpigments.com',
      role: 'it-support',
      addedDate: new Date('2024-02-15'),
    },
    {
      id: '3',
      name: 'James Wilson',
      email: 'james.wilson@atpigments.com',
      role: 'it-support',
      addedDate: new Date('2024-03-01'),
    },
    {
      id: '4',
      name: 'Alex Chen',
      email: 'alex.chen@atpigments.com',
      role: 'it-support',
      addedDate: new Date('2024-03-10'),
    },
    {
      id: '5',
      name: 'Maria Lopez',
      email: 'maria.lopez@atpigments.com',
      role: 'it-support',
      addedDate: new Date('2024-04-01'),
    },
  ]);

  // Dialog states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'it-support' | 'employee'>('it-support');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Handle logo file upload
  const handleLogoUpload = async (company: 'primary' | 'secondary', file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }
    
    try {
      const dataUrl = await fileToDataUrl(file);
      await saveLogo(company, dataUrl);
      toast.success(`${company === 'primary' ? COMPANIES.primary.name : COMPANIES.secondary.name} logo updated!`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload logo';
      toast.error(errorMessage);
    }
  };

  // Filter users by search
  const filteredUsers = users.filter(
    (u: UserEntry) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add new user
  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!newUserEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    const existingUser = users.find(
      (u: UserEntry) => u.email.toLowerCase() === newUserEmail.toLowerCase()
    );
    if (existingUser) {
      toast.error('User with this email already exists');
      return;
    }

    const newUser: UserEntry = {
      id: Date.now().toString(),
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole,
      addedDate: new Date(),
    };

    setUsers([...users, newUser]);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('it-support');
    setIsAddUserOpen(false);
    toast.success(`${newUser.name} added as ${getRoleLabel(newUser.role)}`);
  };

  // Delete user
  const handleDeleteUser = (userId: string) => {
    const user = users.find((u: UserEntry) => u.id === userId);
    if (!user) return;

    // Prevent deleting the main admin
    if (user.email === 'systems@atpigments.com') {
      toast.error('Cannot remove the primary admin account');
      setDeleteUserId(null);
      return;
    }

    setUsers(users.filter((u: UserEntry) => u.id !== userId));
    setDeleteUserId(null);
    toast.success(`${user.name} has been removed`);
  };

  // Change user role
  const handleRoleChange = (userId: string, newRole: 'admin' | 'it-support' | 'employee') => {
    const user = users.find((u: UserEntry) => u.id === userId);
    if (!user) return;

    // Prevent changing the main admin's role
    if (user.email === 'systems@atpigments.com' && newRole !== 'admin') {
      toast.error('Cannot change the primary admin role');
      return;
    }

    setUsers(
      users.map((u: UserEntry) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    toast.success(`${user.name}'s role changed to ${getRoleLabel(newRole)}`);
  };

  // Get role label
  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'it-support':
        return 'IT Support';
      case 'employee':
        return 'Employee';
      default:
        return role;
    }
  };

  // Get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-gradient-to-r from-destructive to-red-400 text-destructive-foreground gap-1 shadow-sm">
            <Crown className="h-3 w-3" />
            Admin
          </Badge>
        );
      case 'it-support':
        return (
          <Badge className="bg-gradient-to-r from-primary to-purple-400 text-primary-foreground gap-1 shadow-sm">
            <UserCog className="h-3 w-3" />
            IT Support
          </Badge>
        );
      case 'employee':
        return (
          <Badge variant="secondary" className="gap-1">
            <User className="h-3 w-3" />
            Employee
          </Badge>
        );
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  // Check if current user is admin
  if (!isUserAdmin) {
    return (
      <motion.div 
        className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="h-24 w-24 rounded-3xl bg-destructive/10 flex items-center justify-center">
          <Lock className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground text-center max-w-md">
          You do not have permission to access this page. Only administrators can manage user roles and permissions.
        </p>
      </motion.div>
    );
  }

  const adminCount = users.filter((u: UserEntry) => u.role === 'admin').length;
  const itSupportCount = users.filter((u: UserEntry) => u.role === 'it-support').length;
  const employeeCount = users.filter((u: UserEntry) => u.role === 'employee').length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 space-y-8 max-w-6xl mx-auto"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Admin Settings
            <Settings className="h-7 w-7 text-primary animate-spin-slow" />
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage branding, user roles, and permissions
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="branding" className="gap-2">
            <Image className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2">
            <Server className="h-4 w-4" />
            Database
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="mt-6 space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Company Logos
                    </CardTitle>
                    <CardDescription>
                      Upload custom logos for the navigation panel. Logos appear in the sidebar header.
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={async () => {
                      await resetLogos();
                      toast.success('Logos reset to defaults');
                    }}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Primary Company Logo */}
                  <div className="rounded-xl border-2 border-dashed border-border p-6 space-y-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${COMPANIES.primary.colors.from} 0%, ${COMPANIES.primary.colors.to} 100%)`,
                        }}
                      >
                        {logos.primary ? (
                          <img src={logos.primary} alt="Primary Logo" className="h-10 w-10 object-contain" />
                        ) : (
                          <span className="text-white font-bold text-sm">{COMPANIES.primary.initials}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{COMPANIES.primary.name}</h3>
                        <p className="text-xs text-muted-foreground">{COMPANIES.primary.shortName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        ref={primaryLogoRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload('primary', file);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => primaryLogoRef.current?.click()}
                        className="gap-2 flex-1"
                      >
                        <Upload className="h-4 w-4" />
                        {logos.primary ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                      {logos.primary && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            await removeLogo('primary');
                            toast.success('Primary logo removed');
                          }}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {logos.primary && (
                      <div className="relative rounded-lg border bg-muted/30 p-4 flex items-center justify-center">
                        <img 
                          src={logos.primary} 
                          alt="Primary Logo Preview" 
                          className="max-h-20 max-w-full object-contain"
                        />
                        <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                          Preview
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Secondary Company Logo */}
                  <div className="rounded-xl border-2 border-dashed border-border p-6 space-y-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${COMPANIES.secondary.colors.from} 0%, ${COMPANIES.secondary.colors.to} 100%)`,
                        }}
                      >
                        {logos.secondary ? (
                          <img src={logos.secondary} alt="Secondary Logo" className="h-10 w-10 object-contain" />
                        ) : (
                          <span className="text-white font-bold text-sm">{COMPANIES.secondary.initials}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{COMPANIES.secondary.name}</h3>
                        <p className="text-xs text-muted-foreground">{COMPANIES.secondary.shortName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        ref={secondaryLogoRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload('secondary', file);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => secondaryLogoRef.current?.click()}
                        className="gap-2 flex-1"
                      >
                        <Upload className="h-4 w-4" />
                        {logos.secondary ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                      {logos.secondary && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            await removeLogo('secondary');
                            toast.success('Secondary logo removed');
                          }}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {logos.secondary && (
                      <div className="relative rounded-lg border bg-muted/30 p-4 flex items-center justify-center">
                        <img 
                          src={logos.secondary} 
                          alt="Secondary Logo Preview" 
                          className="max-h-20 max-w-full object-contain"
                        />
                        <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                          Preview
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-muted/30 border">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Logo Guidelines
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Recommended size: 200x200 pixels or larger (square format works best)</li>
                    <li>• Supported formats: PNG, JPG, SVG, WebP</li>
                    <li>• Maximum file size: 2MB</li>
                    <li>• Transparent backgrounds work best for a clean look</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>


          {/* Navigation Preview */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Navigation Panel Preview</CardTitle>
                <CardDescription>This is how your logos will appear in the sidebar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl bg-sidebar p-5 max-w-xs">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden shadow-sm"
                        style={{
                          background: logos.primary 
                            ? 'white' 
                            : `linear-gradient(135deg, ${COMPANIES.primary.colors.from} 0%, ${COMPANIES.primary.colors.to} 100%)`,
                        }}
                      >
                        {logos.primary ? (
                          <img src={logos.primary} alt="" className="h-6 w-6 object-contain" />
                        ) : (
                          <span className="text-white font-bold text-xs">{COMPANIES.primary.initials}</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">{COMPANIES.primary.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden shadow-sm"
                        style={{
                          background: logos.secondary 
                            ? 'white' 
                            : `linear-gradient(135deg, ${COMPANIES.secondary.colors.from} 0%, ${COMPANIES.secondary.colors.to} 100%)`,
                        }}
                      >
                        {logos.secondary ? (
                          <img src={logos.secondary} alt="" className="h-6 w-6 object-contain" />
                        ) : (
                          <span className="text-white font-bold text-xs">{COMPANIES.secondary.initials}</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">{COMPANIES.secondary.name}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="mt-6 space-y-6">
          {/* Connection Status */}
          <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-green-500/5 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">Connected</p>
                    <p className="text-xs text-muted-foreground mt-1">Dataverse Active</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Server className="h-7 w-7 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-primary/5 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tables</p>
                    <p className="text-4xl font-bold text-foreground mt-2">8</p>
                    <p className="text-xs text-muted-foreground mt-1">Active entities</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Table2 className="h-7 w-7 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-accent/5 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Environment</p>
                    <p className="text-xl font-bold text-foreground mt-2">Production</p>
                    <p className="text-xs text-muted-foreground mt-1">Power Platform</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HardDrive className="h-7 w-7 text-accent-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* How to Connect After Publishing */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  How to Access Your Data After Publishing
                </CardTitle>
                <CardDescription>Step-by-step guide to connect to your live Dataverse database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Publish Your App</h4>
                    <p className="text-sm text-muted-foreground mb-2">Click the "Publish" button in Power Apps Studio. This creates Dataverse tables automatically.</p>
                    <a href="https://make.powerapps.com" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-3 w-3" />
                        Open Power Apps Maker Portal
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Find Your Environment</h4>
                    <p className="text-sm text-muted-foreground mb-2">Go to Admin Center → Environments → Select your environment → Copy the Environment URL.</p>
                    <a href="https://admin.powerplatform.microsoft.com/environments" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-3 w-3" />
                        Open Environments List
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Access Your Tables</h4>
                    <p className="text-sm text-muted-foreground mb-3">Navigate to Tables in the Maker Portal to view, edit, and manage your data directly.</p>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-xs font-medium text-foreground mb-2">Direct Link to Your Tables:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs font-mono text-muted-foreground truncate">
                          https://make.powerapps.com/environments/[ENV-ID]/entities
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => {
                            navigator.clipboard.writeText('https://make.powerapps.com/environments/[ENV-ID]/entities');
                            toast.success('Link copied! Replace [ENV-ID] with your environment ID');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Access Links */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Link className="h-4 w-4 text-primary" />
                    Quick Access Links
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <a
                      href="https://make.powerapps.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border p-4 hover:border-primary/50 hover:bg-muted/30 transition-all group flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <ExternalLink className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">Maker Portal</h3>
                        <p className="text-xs text-muted-foreground">Build & edit apps</p>
                      </div>
                    </a>

                    <a
                      href="https://admin.powerplatform.microsoft.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border p-4 hover:border-primary/50 hover:bg-muted/30 transition-all group flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                        <Settings className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">Admin Center</h3>
                        <p className="text-xs text-muted-foreground">Manage environments</p>
                      </div>
                    </a>

                    <a
                      href="https://make.powerapps.com/tables"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border p-4 hover:border-primary/50 hover:bg-muted/30 transition-all group flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                        <Table2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">Dataverse Tables</h3>
                        <p className="text-xs text-muted-foreground">View & edit data</p>
                      </div>
                    </a>

                    <a
                      href="https://learn.microsoft.com/en-us/power-apps/maker/data-platform/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border p-4 hover:border-primary/50 hover:bg-muted/30 transition-all group flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                        <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">Documentation</h3>
                        <p className="text-xs text-muted-foreground">Learn Dataverse</p>
                      </div>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Database Tables */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Table2 className="h-5 w-5 text-primary" />
                  Database Tables
                </CardTitle>
                <CardDescription>Dataverse tables and their logical names</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Table Name</TableHead>
                        <TableHead className="font-semibold">Logical Name (Dataverse)</TableHead>
                        <TableHead className="font-semibold">Records</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { name: 'Tickets', logical: 'cr5c2_ticket', records: tickets.length, icon: FileSpreadsheet },
                        { name: 'Companies', logical: 'cr5c2_company', records: companies.length, icon: Building2 },
                        { name: 'Departments', logical: 'cr5c2_department', records: departments.length, icon: Database },
                        { name: 'Users', logical: 'cr5c2_user', records: users.length, icon: Users },
                        { name: 'Roles', logical: 'cr5c2_role', records: 4, icon: Shield },
                        { name: 'Categories', logical: 'cr5c2_category', records: 6, icon: Database },
                        { name: 'Comments', logical: 'cr5c2_comment', records: 12, icon: Database },
                        { name: 'App Settings', logical: 'cr5c2_appsetting', records: 2, icon: Settings },
                      ].map((table: { name: string; logical: string; records: number; icon: React.ElementType }) => {
                        const IconComponent = table.icon;
                        return (
                          <TableRow key={table.logical} className="group hover:bg-muted/30 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <IconComponent className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">{table.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="px-2 py-1 rounded bg-muted text-xs font-mono">{table.logical}</code>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{table.records}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  navigator.clipboard.writeText(table.logical);
                                  toast.success(`Copied: ${table.logical}`);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                                Copy Name
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Table Path Info */}
                <div className="mt-6 p-4 rounded-lg bg-muted/30 border">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Data Storage Paths
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium text-foreground min-w-[120px]">API Endpoint:</span>
                      <code className="flex-1 px-3 py-2 rounded bg-card border font-mono text-xs text-muted-foreground break-all">
                        https://org[ID].api.crm.dynamics.com/api/data/v9.2/
                      </code>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium text-foreground min-w-[120px]">Table Path:</span>
                      <code className="flex-1 px-3 py-2 rounded bg-card border font-mono text-xs text-muted-foreground break-all">
                        /api/data/v9.2/[table_logical_name]s
                      </code>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium text-foreground min-w-[120px]">Example:</span>
                      <code className="flex-1 px-3 py-2 rounded bg-card border font-mono text-xs text-muted-foreground break-all">
                        GET /api/data/v9.2/cr5c2_tickets?$select=cr5c2_title,cr5c2_status
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Table Schema Viewer */}
          <TableSchemaViewer />

          {/* Storage Info */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Data Storage Information</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your app data is stored in Microsoft Dataverse, a cloud-based storage space that provides:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Enterprise-grade security and compliance</li>
                      <li>Automatic backup and disaster recovery</li>
                      <li>Role-based access control (RBAC)</li>
                      <li>Full audit trail of data changes</li>
                      <li>Integration with Power Platform and Dynamics 365</li>
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href="https://learn.microsoft.com/en-us/power-apps/maker/data-platform/data-platform-intro"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="gap-2">
                          <ExternalLink className="h-3 w-3" />
                          Learn More
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Data Import/Export Tab */}
        <TabsContent value="data" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-primary/5 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tickets</p>
                    <p className="text-4xl font-bold text-foreground mt-2">{tickets.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total records</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="h-7 w-7 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-accent/5 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Companies</p>
                    <p className="text-4xl font-bold text-foreground mt-2">{companies.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Active organizations</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building2 className="h-7 w-7 text-accent-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Departments</p>
                    <p className="text-4xl font-bold text-foreground mt-2">{departments.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">Registered departments</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Database className="h-7 w-7 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Export Data Section */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileDown className="h-5 w-5 text-primary" />
                      Export Data
                    </CardTitle>
                    <CardDescription>Download data as CSV files (Excel compatible)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border-2 border-dashed border-border p-5 hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Tickets</h3>
                        <p className="text-xs text-muted-foreground">{tickets.length} records</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        const csv = exportTicketsToCSV(tickets);
                        downloadCSV(csv, `tickets-export-${new Date().toISOString().split('T')[0]}.csv`);
                        toast.success('Tickets exported successfully!');
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Export Tickets
                    </Button>
                  </div>

                  <div className="rounded-xl border-2 border-dashed border-border p-5 hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Companies</h3>
                        <p className="text-xs text-muted-foreground">{companies.length} records</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        const csv = exportCompaniesToCSV(companies);
                        downloadCSV(csv, `companies-export-${new Date().toISOString().split('T')[0]}.csv`);
                        toast.success('Companies exported successfully!');
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Export Companies
                    </Button>
                  </div>

                  <div className="rounded-xl border-2 border-dashed border-border p-5 hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                        <Database className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Departments</h3>
                        <p className="text-xs text-muted-foreground">{departments.length} records</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        const csv = exportDepartmentsToCSV(departments);
                        downloadCSV(csv, `departments-export-${new Date().toISOString().split('T')[0]}.csv`);
                        toast.success('Departments exported successfully!');
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Export Departments
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Import Data Section */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileUp className="h-5 w-5 text-primary" />
                      Import Data
                    </CardTitle>
                    <CardDescription>Upload CSV files to import data into the system</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Import Type Selection */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="import-type" className="mb-2 block">Data Type</Label>
                    <Select value={importType} onValueChange={(val: string) => setImportType(val as 'tickets' | 'companies' | 'departments')}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tickets">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-primary" />
                            Tickets
                          </div>
                        </SelectItem>
                        <SelectItem value="companies">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-accent-foreground" />
                            Companies
                          </div>
                        </SelectItem>
                        <SelectItem value="departments">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-muted-foreground" />
                            Departments
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="mb-2 block">Sample Template</Label>
                    <Button
                      variant="outline"
                      className="w-full h-11 gap-2"
                      onClick={() => {
                        let csv = '';
                        let filename = '';
                        if (importType === 'tickets') {
                          csv = getSampleTicketsCSV();
                          filename = 'sample-tickets-template.csv';
                        } else if (importType === 'companies') {
                          csv = getSampleCompaniesCSV();
                          filename = 'sample-companies-template.csv';
                        } else {
                          csv = getSampleDepartmentsCSV();
                          filename = 'sample-departments-template.csv';
                        }
                        downloadCSV(csv, filename);
                        toast.success(`Sample ${importType} template downloaded!`);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      Download Sample Template
                    </Button>
                  </div>
                </div>

                {/* File Upload */}
                <div className="rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    ref={importFileRef}
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImportFile(file);
                        setImportErrors([]);
                        // Parse and preview
                        const reader = new FileReader();
                        reader.onload = (event: ProgressEvent<FileReader>) => {
                          const content = event.target?.result as string;
                          const rows = parseCSV(content);
                          setImportPreview(rows.slice(0, 6)); // Show first 5 rows + header
                          
                          // Validate
                          if (rows.length > 1) {
                            const headers = rows[0];
                            const dataRows = rows.slice(1);
                            let validation: { valid: boolean; errors: string[] };
                            if (importType === 'tickets') {
                              validation = validateTicketImport(dataRows, headers);
                            } else if (importType === 'companies') {
                              validation = validateCompanyImport(dataRows, headers);
                            } else {
                              validation = validateDepartmentImport(dataRows, headers);
                            }
                            setImportErrors(validation.errors);
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                  <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Upload CSV File</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop or click to select a CSV file
                  </p>
                  <Button onClick={() => importFileRef.current?.click()} className="gap-2">
                    <FileUp className="h-4 w-4" />
                    Select File
                  </Button>
                </div>

                {/* File Preview */}
                {importFile && (
                  <div className="rounded-xl border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileSpreadsheet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{importFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(importFile.size / 1024).toFixed(1)} KB • {importPreview ? importPreview.length - 1 : 0} rows
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setImportFile(null);
                            setImportPreview(null);
                            setImportErrors([]);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Preview Table */}
                    {importPreview && importPreview.length > 0 && (
                      <div className="rounded-lg border overflow-hidden">
                        <div className="bg-muted/50 px-4 py-2 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Data Preview</span>
                        </div>
                        <ScrollArea className="max-h-[200px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {importPreview[0].map((header: string, idx: number) => (
                                  <TableHead key={idx} className="text-xs font-semibold whitespace-nowrap">
                                    {header}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {importPreview.slice(1).map((row: string[], rowIdx: number) => (
                                <TableRow key={rowIdx}>
                                  {row.map((cell: string, cellIdx: number) => (
                                    <TableCell key={cellIdx} className="text-xs whitespace-nowrap max-w-[150px] truncate">
                                      {cell || '-'}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </div>
                    )}

                    {/* Validation Errors */}
                    {importErrors.length > 0 && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          <span className="font-semibold text-destructive">Validation Errors</span>
                        </div>
                        <ul className="space-y-1">
                          {importErrors.map((error: string, idx: number) => (
                            <li key={idx} className="text-sm text-destructive flex items-start gap-2">
                              <X className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Success State */}
                    {importErrors.length === 0 && importPreview && importPreview.length > 1 && (
                      <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                        <div className="flex items-center gap-2">
                          <Check className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-600">File validated successfully!</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ready to import {importPreview.length - 1} records.
                        </p>
                      </div>
                    )}

                    {/* Import Button */}
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setImportFile(null);
                          setImportPreview(null);
                          setImportErrors([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={importErrors.length > 0 || !importPreview || importPreview.length <= 1 || isImporting}
                        onClick={() => {
                          setIsImporting(true);
                          // Simulate import
                          setTimeout(() => {
                            toast.success(`Successfully imported ${(importPreview?.length || 1) - 1} ${importType}!`);
                            setImportFile(null);
                            setImportPreview(null);
                            setImportErrors([]);
                            setIsImporting(false);
                          }, 1500);
                        }}
                        className="gap-2"
                      >
                        {isImporting ? (
                          <>
                            <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <FileUp className="h-4 w-4" />
                            Import {importType.charAt(0).toUpperCase() + importType.slice(1)}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Import Tips */}
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Import Guidelines
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Download the sample template to see the required format</li>
                    <li>• Ensure all required columns are filled (marked in template)</li>
                    <li>• Use consistent date format: YYYY-MM-DD</li>
                    <li>• Company names must match existing companies in the system</li>
                    <li>• Maximum file size: 5MB</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-destructive/5 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administrators</p>
                    <p className="text-4xl font-bold text-foreground mt-2">{adminCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Full access</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Crown className="h-7 w-7 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-primary/5 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">IT Support Staff</p>
                    <p className="text-4xl font-bold text-foreground mt-2">{itSupportCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Manage tickets</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserCog className="h-7 w-7 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employees</p>
                    <p className="text-4xl font-bold text-foreground mt-2">{employeeCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Create & view own</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="h-7 w-7 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Role Permissions */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Role Permissions
                </CardTitle>
                <CardDescription>Understanding what each role can do</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border-2 border-destructive/20 bg-destructive/5 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                        <Crown className="h-5 w-5 text-destructive" />
                      </div>
                      <h3 className="font-bold">Administrator</h3>
                    </div>
                    <ul className="space-y-2">
                      {['Full system access', 'Manage all tickets', 'Add/remove users', 'Change user roles', 'View admin settings'].map((perm: string) => (
                        <li key={perm} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <UserCog className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-bold">IT Support</h3>
                    </div>
                    <ul className="space-y-2">
                      {['View all tickets', 'Update ticket status', 'Assign tickets', 'Add internal notes', 'Create own tickets'].map((perm: string) => (
                        <li key={perm} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border-2 border-border bg-muted/30 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <h3 className="font-bold">Employee</h3>
                    </div>
                    <ul className="space-y-2">
                      {['Create new tickets', 'View own tickets', 'Add comments', 'Track ticket status'].map((perm: string) => (
                        <li key={perm} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Users Table */}
          <motion.div variants={itemVariants}>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      User Management
                    </CardTitle>
                    <CardDescription>Add, remove, or change user roles</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-full lg:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10"
                      />
                    </div>
                    <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2 shadow-lg shadow-primary/25">
                          <Plus className="h-4 w-4" />
                          Add User
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Add New User
                          </DialogTitle>
                          <DialogDescription>
                            Add a user and assign their role for the IT Help Desk system.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              placeholder="Enter full name"
                              value={newUserName}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setNewUserName(e.target.value)
                              }
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="user@company.com"
                              value={newUserEmail}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setNewUserEmail(e.target.value)
                              }
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                              value={newUserRole}
                              onValueChange={(val: string) =>
                                setNewUserRole(val as 'admin' | 'it-support' | 'employee')
                              }
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">
                                  <div className="flex items-center gap-2">
                                    <Crown className="h-4 w-4 text-destructive" />
                                    Administrator
                                  </div>
                                </SelectItem>
                                <SelectItem value="it-support">
                                  <div className="flex items-center gap-2">
                                    <UserCog className="h-4 w-4 text-primary" />
                                    IT Support
                                  </div>
                                </SelectItem>
                                <SelectItem value="employee">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Employee
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddUser} className="gap-2">
                            <Save className="h-4 w-4" />
                            Add User
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">User</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold hidden md:table-cell">Added</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredUsers.map((user: UserEntry) => (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="group hover:bg-muted/30 transition-colors"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-400 text-primary-foreground font-semibold">
                                    {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="font-medium text-foreground">{user.name}</span>
                                  {user.email === 'systems@atpigments.com' && (
                                    <Badge variant="outline" className="ml-2 text-xs">Primary</Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">{user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.role}
                                onValueChange={(val: string) =>
                                  handleRoleChange(user.id, val as 'admin' | 'it-support' | 'employee')
                                }
                                disabled={user.email === 'systems@atpigments.com'}
                              >
                                <SelectTrigger className="w-[160px] h-9 border-0 bg-transparent hover:bg-muted transition-colors">
                                  <SelectValue>{getRoleBadge(user.role)}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                      <Crown className="h-4 w-4 text-destructive" />
                                      Administrator
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="it-support">
                                    <div className="flex items-center gap-2">
                                      <UserCog className="h-4 w-4 text-primary" />
                                      IT Support
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="employee">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      Employee
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                              {user.addedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </TableCell>
                            <TableCell className="text-right">
                              <Dialog
                                open={deleteUserId === user.id}
                                onOpenChange={(open: boolean) => setDeleteUserId(open ? user.id : null)}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={user.email === 'systems@atpigments.com'}
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                                      <AlertTriangle className="h-8 w-8 text-destructive" />
                                    </div>
                                    <DialogTitle className="text-center">Remove User</DialogTitle>
                                    <DialogDescription className="text-center">
                                      Are you sure you want to remove <strong>{user.name}</strong> from the system? 
                                      This will revoke their access to IT Help Desk.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter className="sm:justify-center gap-3">
                                    <Button variant="outline" onClick={() => setDeleteUserId(null)}>
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="gap-2"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Remove User
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} total
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
