import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Shield,
  ShieldCheck,
  Mail,
  Building2,
  Briefcase,
  Calendar,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
  Loader2,
  Download,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog';
import { Switch } from './components/ui/switch';
import { Skeleton } from './components/ui/skeleton';
import { ScrollArea } from './components/ui/scroll-area';
import { InMemoryDataBanner } from './generated/components';
import { HAS_IN_MEMORY_TABLES } from './generated/hooks';

import {
  useUsersList,
  useCreateUsers,
  useUpdateUsers,
  useDeleteUsers,
  CreateUsersSchema,
} from './generated/hooks/use-users';
import { useRoleList } from './generated/hooks/use-role';
import type { Users as UsersType } from './generated/models/users-model';
import type { CreateUsersInput } from './generated/hooks/use-users';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const;

function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' {
  const roleLower = role.toLowerCase();
  if (roleLower.includes('admin')) return 'default';
  if (roleLower.includes('support') || roleLower.includes('it')) return 'secondary';
  return 'outline';
}

function getRoleIcon(role: string) {
  const roleLower = role.toLowerCase();
  if (roleLower.includes('admin')) return <ShieldCheck className="h-3 w-3" />;
  return <Shield className="h-3 w-3" />;
}

export default function UserManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UsersType | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string[][] | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  const { data: users, isLoading } = useUsersList();
  const { data: roles } = useRoleList();
  const createUser = useCreateUsers();
  const updateUser = useUpdateUsers();
  const deleteUser = useDeleteUsers();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUsersInput>({
    resolver: zodResolver(CreateUsersSchema),
    defaultValues: {
      userName: '',
      emailID: '',
      role: '',
      department: '',
      company: '',
      phoneNumber: '',
      jobTitle: '',
      isActive: true,
      permissions: '',
    },
  });

  const watchIsActive = watch('isActive');

  // Filter users
  const filteredUsers = users?.filter((user: UsersType) => {
    const matchesSearch =
      user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.emailID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.company?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUser = () => {
    reset({
      userName: '',
      emailID: '',
      role: '',
      department: '',
      company: '',
      phoneNumber: '',
      jobTitle: '',
      isActive: true,
      permissions: '',
    });
    setIsAddDialogOpen(true);
  };

  const handleEditUser = (user: UsersType) => {
    setSelectedUser(user);
    reset({
      userName: user.userName,
      emailID: user.emailID,
      role: user.role,
      department: user.department || '',
      company: user.company || '',
      phoneNumber: user.phoneNumber || '',
      jobTitle: user.jobTitle || '',
      isActive: user.isActive,
      permissions: user.permissions || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (user: UsersType) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const onSubmitCreate = async (data: CreateUsersInput) => {
    try {
      await createUser.mutateAsync({
        ...data,
        addedDate: new Date().toISOString(),
      });
      toast.success('User created successfully');
      setIsAddDialogOpen(false);
      reset();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  const onSubmitEdit = async (data: CreateUsersInput) => {
    if (!selectedUser) return;
    try {
      await updateUser.mutateAsync({
        id: selectedUser.id,
        changedFields: data,
      });
      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      reset();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser.mutateAsync(selectedUser.id);
      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const toggleUserStatus = async (user: UsersType) => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        changedFields: { isActive: !user.isActive },
      });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };

  const uniqueRoles = [...new Set(users?.map((u: UsersType) => u.role) || [])];

  // Export users to CSV
  const handleExportUsers = () => {
    if (!users || users.length === 0) {
      toast.error('No users to export');
      return;
    }

    const headers = ['UserName', 'EmailID', 'Role', 'Department', 'Company', 'PhoneNumber', 'JobTitle', 'IsActive', 'Permissions', 'AddedDate'];
    const rows = users.map((user: UsersType) => [
      user.userName,
      user.emailID,
      user.role,
      user.department || '',
      user.company || '',
      user.phoneNumber || '',
      user.jobTitle || '',
      user.isActive ? 'Yes' : 'No',
      user.permissions || '',
      user.addedDate ? new Date(user.addedDate).toISOString().split('T')[0] : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell: string) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success(`Exported ${users.length} users to CSV`);
  };

  // Download sample CSV template
  const handleDownloadTemplate = () => {
    const headers = ['UserName', 'EmailID', 'Role', 'Department', 'Company', 'PhoneNumber', 'JobTitle', 'IsActive', 'Permissions'];
    const sampleRows = [
      ['John Doe', 'john.doe@company.com', 'IT Support', 'Information Technology', 'AT Inks Ltd', '+91 98765 43210', 'IT Specialist', 'Yes', 'ticket_view,ticket_edit'],
      ['Jane Smith', 'jane.smith@company.com', 'User', 'Human Resources', 'AT Pigments Ltd', '+91 98765 43211', 'HR Manager', 'Yes', 'ticket_create'],
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'users-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success('Template downloaded');
  };

  // Parse CSV file
  const parseCSV = (content: string): string[][] => {
    const lines = content.split('\n').filter((line: string) => line.trim());
    return lines.map((line: string) => {
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim());
      return cells;
    });
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setImportFile(file);
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const content = event.target?.result as string;
      const rows = parseCSV(content);
      setImportPreview(rows.slice(0, 6));

      if (rows.length > 1) {
        const headers = rows[0];
        const localErrors: string[] = [];
        const requiredHeaders = ['UserName', 'EmailID', 'Role'];
        const headerMap: Record<string, number> = {};
        headers.forEach((h: string, i: number) => { headerMap[h.trim()] = i; });

        for (const required of requiredHeaders) {
          if (!(required in headerMap)) {
            localErrors.push(`Missing required column: ${required}`);
          }
        }

        if (localErrors.length === 0) {
          const validRoles = roles?.map((r) => r.role.toLowerCase()) || [];
          const dataRows = rows.slice(1);
          dataRows.forEach((row: string[], idx: number) => {
            const rowNum = idx + 2;
            const userName = row[headerMap['UserName']]?.trim();
            const emailID = row[headerMap['EmailID']]?.trim();
            const role = row[headerMap['Role']]?.trim();

            if (!userName) localErrors.push(`Row ${rowNum}: UserName is required`);
            if (!emailID) localErrors.push(`Row ${rowNum}: EmailID is required`);
            else if (!emailID.includes('@')) localErrors.push(`Row ${rowNum}: Invalid email format`);
            if (!role) localErrors.push(`Row ${rowNum}: Role is required`);
            else if (!validRoles.includes(role.toLowerCase())) {
              localErrors.push(`Row ${rowNum}: Invalid role "${role}"`);
            }
          });
        }
        setImportErrors(localErrors.slice(0, 5));
      }
    };
    reader.readAsText(file);
  };

  // Handle import
  const handleImport = async () => {
    if (!importFile || !importPreview || importPreview.length <= 1) return;
    setIsImporting(true);

    try {
      const headers = importPreview[0];
      const headerMap: Record<string, number> = {};
      headers.forEach((h: string, i: number) => { headerMap[h.trim()] = i; });

      const reader = new FileReader();
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        const content = event.target?.result as string;
        const rows = parseCSV(content).slice(1);

        let successCount = 0;
        for (const row of rows) {
          const userName = row[headerMap['UserName']]?.trim();
          const emailID = row[headerMap['EmailID']]?.trim();
          const role = row[headerMap['Role']]?.trim();
          const department = row[headerMap['Department']]?.trim() || '';
          const company = row[headerMap['Company']]?.trim() || '';
          const phoneNumber = row[headerMap['PhoneNumber']]?.trim() || '';
          const jobTitle = row[headerMap['JobTitle']]?.trim() || '';
          const isActiveStr = row[headerMap['IsActive']]?.trim() || 'Yes';
          const permissions = row[headerMap['Permissions']]?.trim() || '';

          if (userName && emailID && role) {
            try {
              await createUser.mutateAsync({
                userName,
                emailID,
                role,
                department,
                company,
                phoneNumber,
                jobTitle,
                isActive: ['yes', 'true', '1'].includes(isActiveStr.toLowerCase()),
                permissions,
                addedDate: new Date().toISOString(),
              });
              successCount++;
            } catch {
              // Continue with next user
            }
          }
        }

        toast.success(`Imported ${successCount} users successfully`);
        setIsImportDialogOpen(false);
        setImportFile(null);
        setImportPreview(null);
        setImportErrors([]);
        setIsImporting(false);
      };
      reader.readAsText(importFile);
    } catch {
      toast.error('Failed to import users');
      setIsImporting(false);
    }
  };

  const stats = {
    total: users?.length || 0,
    active: users?.filter((u: UsersType) => u.isActive).length || 0,
    inactive: users?.filter((u: UsersType) => !u.isActive).length || 0,
    admins: users?.filter((u: UsersType) => u.role.toLowerCase().includes('admin')).length || 0,
  };

  return (
    <motion.div
      className="flex flex-col gap-6 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <InMemoryDataBanner
        show={HAS_IN_MEMORY_TABLES}
        message="This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage."
        className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200"
      />

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground">Manage users, roles, and permissions</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExportUsers} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleAddUser} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ToggleRight className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ToggleLeft className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.inactive}</p>
              <p className="text-xs text-muted-foreground">Inactive</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 p-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {uniqueRoles.filter((r: string) => r).map((role: string) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      {/* Users Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Users ({filteredUsers?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" aria-hidden="true" />
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-24" aria-hidden="true" />
                              <Skeleton className="h-3 w-32" aria-hidden="true" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-5 w-16" aria-hidden="true" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" aria-hidden="true" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" aria-hidden="true" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" aria-hidden="true" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" aria-hidden="true" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20 ml-auto" aria-hidden="true" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredUsers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    <AnimatePresence>
                      {filteredUsers?.map((user: UsersType) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                                {user.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{user.userName}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.emailID}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                              {getRoleIcon(user.role)}
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.department ? (
                              <span className="flex items-center gap-1 text-sm text-foreground">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                {user.department}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.company ? (
                              <span className="flex items-center gap-1 text-sm text-foreground">
                                <Briefcase className="h-3 w-3 text-muted-foreground" />
                                {user.company}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => toggleUserStatus(user)}
                              className="group flex items-center gap-2"
                            >
                              {user.isActive ? (
                                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                  <Check className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground hover:bg-muted">
                                  <X className="h-3 w-3 mr-1" />
                                  Inactive
                                </Badge>
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            {user.lastLoginDate ? (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(user.lastLoginDate), 'MMM d, yyyy')}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteUser(user)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Import Users
            </DialogTitle>
            <DialogDescription>Upload a CSV file to import multiple users at once.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template download */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="text-sm">
                <p className="font-medium">Need a template?</p>
                <p className="text-muted-foreground">Download sample CSV with correct format</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
                <Download className="h-4 w-4" />
                Template
              </Button>
            </div>

            {/* File upload */}
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => importFileRef.current?.click()}
            >
              <input
                ref={importFileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Click to upload CSV file</p>
              <p className="text-sm text-muted-foreground">or drag and drop</p>
            </div>

            {/* File info */}
            {importFile && (
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">{importFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(importFile.size / 1024).toFixed(1)} KB • {importPreview ? importPreview.length - 1 : 0} rows
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setImportFile(null);
                    setImportPreview(null);
                    setImportErrors([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Preview */}
            {importPreview && importPreview.length > 0 && (
              <div className="rounded-lg border overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Preview</span>
                </div>
                <ScrollArea className="max-h-[200px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {importPreview[0].map((header: string, idx: number) => (
                          <TableHead key={idx} className="text-xs whitespace-nowrap">{header}</TableHead>
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

            {/* Errors */}
            {importErrors.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 mb-2">
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

            {/* Success state */}
            {importErrors.length === 0 && importPreview && importPreview.length > 1 && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-primary">File validated!</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Ready to import {importPreview.length - 1} users.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={importErrors.length > 0 || !importPreview || importPreview.length <= 1 || isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with role and permissions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Full Name *</Label>
                <Input
                  id="userName"
                  {...register('userName')}
                  placeholder="Enter full name"
                />
                {errors.userName && (
                  <p className="text-sm text-destructive">{errors.userName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailID">Email *</Label>
                <Input
                  id="emailID"
                  type="email"
                  {...register('emailID')}
                  placeholder="user@company.com"
                />
                {errors.emailID && (
                  <p className="text-sm text-destructive">{errors.emailID.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={watch('role')}
                  onValueChange={(val: string) => setValue('role', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.filter((r) => r.role).map((role) => (
                      <SelectItem key={role.id} value={role.role}>
                        {role.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    {...register('department')}
                    placeholder="IT, HR, Sales..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    {...register('company')}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone</Label>
                  <Input
                    id="phoneNumber"
                    {...register('phoneNumber')}
                    placeholder="+91 98765..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    {...register('jobTitle')}
                    placeholder="Manager, Developer..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Active Status</Label>
                  <p className="text-xs text-muted-foreground">
                    User can access the system
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={watchIsActive}
                  onCheckedChange={(checked: boolean) => setValue('isActive', checked)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || createUser.isPending}>
                {(isSubmitting || createUser.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-userName">Full Name *</Label>
                <Input
                  id="edit-userName"
                  {...register('userName')}
                  placeholder="Enter full name"
                />
                {errors.userName && (
                  <p className="text-sm text-destructive">{errors.userName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-emailID">Email *</Label>
                <Input
                  id="edit-emailID"
                  type="email"
                  {...register('emailID')}
                  placeholder="user@company.com"
                />
                {errors.emailID && (
                  <p className="text-sm text-destructive">{errors.emailID.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Role *</Label>
                <Select
                  value={watch('role')}
                  onValueChange={(val: string) => setValue('role', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.filter((r) => r.role).map((role) => (
                      <SelectItem key={role.id} value={role.role}>
                        {role.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    {...register('department')}
                    placeholder="IT, HR, Sales..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-company">Company</Label>
                  <Input
                    id="edit-company"
                    {...register('company')}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phoneNumber">Phone</Label>
                  <Input
                    id="edit-phoneNumber"
                    {...register('phoneNumber')}
                    placeholder="+91 98765..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-jobTitle">Job Title</Label>
                  <Input
                    id="edit-jobTitle"
                    {...register('jobTitle')}
                    placeholder="Manager, Developer..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-isActive">Active Status</Label>
                  <p className="text-xs text-muted-foreground">
                    User can access the system
                  </p>
                </div>
                <Switch
                  id="edit-isActive"
                  checked={watchIsActive}
                  onCheckedChange={(checked: boolean) => setValue('isActive', checked)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || updateUser.isPending}>
                {(isSubmitting || updateUser.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.userName}</strong>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
