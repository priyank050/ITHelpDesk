import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  Check,
  X,
  Edit2,
  Save,
  Loader2,
  Info,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Users,
  Settings,
  FileText,
  BarChart3,
  MessageSquare,
  Bell,
  Lock,
  Sparkles,
  Copy,
  Zap,
  Crown,
  UserCog,
  Headphones,
  Eye as EyeIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card';
import { Switch } from './components/ui/switch';
import { ScrollArea } from './components/ui/scroll-area';
import { Skeleton } from './components/ui/skeleton';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './components/ui/tooltip';
import { InMemoryDataBanner } from './generated/components';
import { HAS_IN_MEMORY_TABLES } from './generated/hooks';

import { useRoleList, useCreateRole, useDeleteRole } from './generated/hooks/use-role';
import type { Role } from './generated/models/role-model';

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

// Permission categories and their permissions
const permissionCategories = [
  {
    id: 'tickets',
    name: 'Tickets',
    icon: FileText,
    description: 'Ticket management permissions',
    permissions: [
      { id: 'ticket_view', name: 'View Tickets', description: 'View all tickets in the system' },
      { id: 'ticket_create', name: 'Create Tickets', description: 'Create new support tickets' },
      { id: 'ticket_edit', name: 'Edit Tickets', description: 'Edit and update tickets' },
      { id: 'ticket_delete', name: 'Delete Tickets', description: 'Delete tickets permanently' },
      { id: 'ticket_assign', name: 'Assign Tickets', description: 'Assign tickets to team members' },
      { id: 'ticket_close', name: 'Close Tickets', description: 'Close and resolve tickets' },
    ],
  },
  {
    id: 'users',
    name: 'Users',
    icon: Users,
    description: 'User management permissions',
    permissions: [
      { id: 'user_view', name: 'View Users', description: 'View user list and profiles' },
      { id: 'user_create', name: 'Create Users', description: 'Create new user accounts' },
      { id: 'user_edit', name: 'Edit Users', description: 'Edit user information' },
      { id: 'user_delete', name: 'Delete Users', description: 'Delete user accounts' },
      { id: 'user_roles', name: 'Manage Roles', description: 'Assign and modify user roles' },
    ],
  },
  {
    id: 'reports',
    name: 'Reports',
    icon: BarChart3,
    description: 'Reporting and analytics permissions',
    permissions: [
      { id: 'report_view', name: 'View Reports', description: 'View analytics and reports' },
      { id: 'report_export', name: 'Export Reports', description: 'Export reports to CSV/PDF' },
      { id: 'report_create', name: 'Create Reports', description: 'Create custom reports' },
    ],
  },
  {
    id: 'knowledge',
    name: 'Knowledge Base',
    icon: MessageSquare,
    description: 'Knowledge base permissions',
    permissions: [
      { id: 'kb_view', name: 'View Articles', description: 'View knowledge base articles' },
      { id: 'kb_create', name: 'Create Articles', description: 'Create new KB articles' },
      { id: 'kb_edit', name: 'Edit Articles', description: 'Edit existing articles' },
      { id: 'kb_delete', name: 'Delete Articles', description: 'Delete KB articles' },
      { id: 'kb_publish', name: 'Publish Articles', description: 'Publish articles to public' },
    ],
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    description: 'System settings permissions',
    permissions: [
      { id: 'settings_view', name: 'View Settings', description: 'View system settings' },
      { id: 'settings_edit', name: 'Edit Settings', description: 'Modify system settings' },
      { id: 'settings_sla', name: 'Manage SLA', description: 'Configure SLA policies' },
      { id: 'settings_categories', name: 'Manage Categories', description: 'Manage ticket categories' },
    ],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: Bell,
    description: 'Notification settings permissions',
    permissions: [
      { id: 'notif_receive', name: 'Receive Notifications', description: 'Receive system notifications' },
      { id: 'notif_manage', name: 'Manage Notifications', description: 'Configure notification settings' },
    ],
  },
];

// Get all permission IDs in a flat array
const allPermissionIds = permissionCategories.flatMap((cat) =>
  cat.permissions.map((p) => p.id)
);

// Preset role templates
interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  icon: typeof Shield;
  color: string;
  permissions: string[];
}

const roleTemplates: RoleTemplate[] = [
  {
    id: 'full_admin',
    name: 'Full Administrator',
    description: 'Complete access to all system features and settings',
    icon: Crown,
    color: 'bg-amber-500',
    permissions: allPermissionIds,
  },
  {
    id: 'team_lead',
    name: 'Team Lead',
    description: 'Manage tickets and team members, view reports',
    icon: UserCog,
    color: 'bg-blue-500',
    permissions: [
      'ticket_view', 'ticket_create', 'ticket_edit', 'ticket_assign', 'ticket_close',
      'user_view', 'user_edit', 'user_roles',
      'report_view', 'report_export',
      'kb_view', 'kb_create', 'kb_edit',
      'settings_view',
      'notif_receive', 'notif_manage',
    ],
  },
  {
    id: 'support_agent',
    name: 'Support Agent',
    description: 'Handle tickets and access knowledge base',
    icon: Headphones,
    color: 'bg-green-500',
    permissions: [
      'ticket_view', 'ticket_create', 'ticket_edit', 'ticket_close',
      'user_view',
      'report_view',
      'kb_view', 'kb_create', 'kb_edit',
      'notif_receive',
    ],
  },
  {
    id: 'viewer',
    name: 'Read-Only Viewer',
    description: 'View-only access to tickets and reports',
    icon: EyeIcon,
    color: 'bg-slate-500',
    permissions: [
      'ticket_view',
      'user_view',
      'report_view',
      'kb_view',
      'settings_view',
      'notif_receive',
    ],
  },
  {
    id: 'custom',
    name: 'Custom Role',
    description: 'Start from scratch and select permissions manually',
    icon: Sparkles,
    color: 'bg-purple-500',
    permissions: [],
  },
];

// Default permissions by role name (used since Role table doesn't have permissions column)
const defaultRolePermissions: Record<string, string[]> = {
  'Adminstator': allPermissionIds, // typo in data
  'Administrator': allPermissionIds,
  'IT Support': [
    'ticket_view', 'ticket_create', 'ticket_edit', 'ticket_assign', 'ticket_close',
    'user_view', 'report_view', 'report_export',
    'kb_view', 'kb_create', 'kb_edit',
    'settings_view', 'notif_receive', 'notif_manage',
  ],
  'User': [
    'ticket_view', 'ticket_create',
    'kb_view',
    'notif_receive',
  ],
};

export default function RolePermissionsPage() {
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplate | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [createStep, setCreateStep] = useState<'template' | 'customize'>('template');

  const { data: roles, isLoading } = useRoleList();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();

  // Local state for permissions (keyed by role id)
  const [localPermissions, setLocalPermissions] = useState<Record<string, string[]>>({});

  // Get permissions for a role (from local state or defaults)
  const getRolePermissions = (role: Role): string[] => {
    if (localPermissions[role.id]) {
      return localPermissions[role.id];
    }
    // Return default permissions based on role name
    return defaultRolePermissions[role.role] || [];
  };

  // Check if a role has a specific permission
  const hasPermission = (role: Role, permissionId: string): boolean => {
    return getRolePermissions(role).includes(permissionId);
  };

  // Toggle a permission for a role
  const togglePermission = (roleId: string, permissionId: string) => {
    if (editingRole !== roleId) return;

    const role = roles?.find((r: Role) => r.id === roleId);
    if (!role) return;

    const currentPermissions = localPermissions[roleId] || getRolePermissions(role);
    const newPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter((p: string) => p !== permissionId)
      : [...currentPermissions, permissionId];

    setLocalPermissions({
      ...localPermissions,
      [roleId]: newPermissions,
    });
  };

  // Toggle all permissions in a category
  const toggleCategory = (roleId: string, categoryId: string) => {
    if (editingRole !== roleId) return;

    const role = roles?.find((r: Role) => r.id === roleId);
    if (!role) return;

    const category = permissionCategories.find((c) => c.id === categoryId);
    if (!category) return;

    const categoryPermissionIds = category.permissions.map((p) => p.id);
    const currentPermissions = localPermissions[roleId] || getRolePermissions(role);
    const hasAllCategory = categoryPermissionIds.every((p) =>
      currentPermissions.includes(p)
    );

    let newPermissions: string[];
    if (hasAllCategory) {
      newPermissions = currentPermissions.filter(
        (p: string) => !categoryPermissionIds.includes(p)
      );
    } else {
      newPermissions = [
        ...currentPermissions,
        ...categoryPermissionIds.filter((p) => !currentPermissions.includes(p)),
      ];
    }

    setLocalPermissions({
      ...localPermissions,
      [roleId]: newPermissions,
    });
  };

  // Start editing a role
  const startEditing = (role: Role) => {
    setEditingRole(role.id);
    // Initialize local permissions if not already set
    if (!localPermissions[role.id]) {
      setLocalPermissions({
        ...localPermissions,
        [role.id]: getRolePermissions(role),
      });
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingRole(null);
  };

  // Save changes (simulated since Role table doesn't have permissions column)
  const saveChanges = async (role: Role) => {
    setIsSaving(true);
    // Simulate save delay
    await new Promise((resolve: (value: void) => void) => setTimeout(resolve, 500));
    toast.success(`Permissions updated for ${role.role}`);
    setEditingRole(null);
    setIsSaving(false);
  };

  // Reset create dialog state
  const resetCreateDialog = () => {
    setSelectedTemplate(null);
    setNewRoleName('');
    setNewRoleDescription('');
    setCustomPermissions([]);
    setCreateStep('template');
  };

  // Handle template selection
  const handleTemplateSelect = (template: RoleTemplate) => {
    setSelectedTemplate(template);
    setNewRoleName(template.id === 'custom' ? '' : template.name);
    setNewRoleDescription(template.description);
    setCustomPermissions([...template.permissions]);
    setCreateStep('customize');
  };

  // Toggle custom permission
  const toggleCustomPermission = (permissionId: string) => {
    setCustomPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Toggle all permissions in a category for custom role
  const toggleCustomCategory = (categoryId: string) => {
    const category = permissionCategories.find((c) => c.id === categoryId);
    if (!category) return;

    const categoryPermissionIds = category.permissions.map((p) => p.id);
    const hasAllCategory = categoryPermissionIds.every((p) =>
      customPermissions.includes(p)
    );

    if (hasAllCategory) {
      setCustomPermissions((prev) =>
        prev.filter((p) => !categoryPermissionIds.includes(p))
      );
    } else {
      setCustomPermissions((prev) => [
        ...prev,
        ...categoryPermissionIds.filter((p) => !prev.includes(p)),
      ]);
    }
  };

  // Check if category has all permissions for custom role
  const customCategoryHasAll = (categoryId: string): boolean => {
    const category = permissionCategories.find((c) => c.id === categoryId);
    if (!category) return false;
    return category.permissions.every((p) => customPermissions.includes(p.id));
  };

  // Check if category has some permissions for custom role
  const customCategoryHasSome = (categoryId: string): boolean => {
    const category = permissionCategories.find((c) => c.id === categoryId);
    if (!category) return false;
    return (
      category.permissions.some((p) => customPermissions.includes(p.id)) &&
      !category.permissions.every((p) => customPermissions.includes(p.id))
    );
  };

  // Create new role
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    try {
      const newRole = await createRole.mutateAsync({
        role: newRoleName.trim(),
      });

      // Store permissions in local state
      setLocalPermissions((prev) => ({
        ...prev,
        [newRole.id]: customPermissions,
      }));

      // Also update default role permissions for persistence
      defaultRolePermissions[newRoleName.trim()] = customPermissions;

      toast.success(`Role "${newRoleName}" created successfully with ${customPermissions.length} permissions`);
      setIsCreateDialogOpen(false);
      resetCreateDialog();
    } catch (error: unknown) {
      toast.error('Failed to create role');
    }
  };

  // Delete a role
  const handleDeleteRole = async (role: Role) => {
    if (role.role.toLowerCase().includes('admin')) {
      toast.error('Cannot delete administrator roles');
      return;
    }

    try {
      await deleteRole.mutateAsync(role.id);
      // Remove from local permissions
      setLocalPermissions((prev) => {
        const updated = { ...prev };
        delete updated[role.id];
        return updated;
      });
      toast.success(`Role "${role.role}" deleted`);
    } catch (error: unknown) {
      toast.error('Failed to delete role');
    }
  };

  // Check if a category has all permissions for a role
  const categoryHasAll = (role: Role, categoryId: string): boolean => {
    const category = permissionCategories.find((c) => c.id === categoryId);
    if (!category) return false;
    const rolePermissions = getRolePermissions(role);
    return category.permissions.every((p) => rolePermissions.includes(p.id));
  };

  // Check if a category has some permissions for a role
  const categoryHasSome = (role: Role, categoryId: string): boolean => {
    const category = permissionCategories.find((c) => c.id === categoryId);
    if (!category) return false;
    const rolePermissions = getRolePermissions(role);
    return category.permissions.some((p) => rolePermissions.includes(p.id)) &&
           !category.permissions.every((p) => rolePermissions.includes(p.id));
  };

  // Get count of permissions in a category for a role
  const getCategoryPermissionCount = (role: Role, categoryId: string): { enabled: number; total: number } => {
    const category = permissionCategories.find((c) => c.id === categoryId);
    if (!category) return { enabled: 0, total: 0 };
    const rolePermissions = getRolePermissions(role);
    const enabled = category.permissions.filter((p) => rolePermissions.includes(p.id)).length;
    return { enabled, total: category.permissions.length };
  };

  // Get role badge variant
  const getRoleBadgeVariant = (roleName: string): 'default' | 'secondary' | 'outline' => {
    const lower = roleName.toLowerCase();
    if (lower.includes('admin')) return 'default';
    if (lower.includes('support') || lower.includes('it')) return 'secondary';
    return 'outline';
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
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Role Permissions Matrix</h1>
            <p className="text-sm text-muted-foreground">Configure permissions for each role in the system</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetCreateDialog();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Custom Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {createStep === 'template' ? 'Choose a Role Template' : 'Customize Permissions'}
              </DialogTitle>
              <DialogDescription>
                {createStep === 'template'
                  ? 'Start with a preset template or create a custom role from scratch'
                  : `Configure permissions for your new role${selectedTemplate ? ` based on ${selectedTemplate.name}` : ''}`}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4">
              <AnimatePresence mode="wait">
                {createStep === 'template' ? (
                  <motion.div
                    key="templates"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: 'easeOut' as const }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {roleTemplates.map((template) => (
                      <motion.button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template)}
                        className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all text-left group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${template.color} text-white flex-shrink-0`}>
                          <template.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {template.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {template.permissions.length} permissions
                            </Badge>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="customize"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, ease: 'easeOut' as const }}
                    className="space-y-4"
                  >
                    {/* Role name and description */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="roleName">Role Name *</Label>
                        <Input
                          id="roleName"
                          value={newRoleName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRoleName(e.target.value)}
                          placeholder="e.g., Senior Support Agent"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roleDescription">Description</Label>
                        <Textarea
                          id="roleDescription"
                          value={newRoleDescription}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewRoleDescription(e.target.value)}
                          placeholder="Describe the role's responsibilities..."
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Permission selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Permissions</Label>
                        <Badge variant="secondary">
                          {customPermissions.length} of {allPermissionIds.length} selected
                        </Badge>
                      </div>

                      <div className="border rounded-lg divide-y max-h-[280px] overflow-y-auto">
                        {permissionCategories.map((category) => (
                          <div key={category.id} className="bg-card">
                            {/* Category header */}
                            <button
                              onClick={() => toggleCustomCategory(category.id)}
                              className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <category.icon className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">{category.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({category.permissions.filter((p) => customPermissions.includes(p.id)).length}/{category.permissions.length})
                                </span>
                              </div>
                              <div className={`flex h-5 w-5 items-center justify-center rounded ${
                                customCategoryHasAll(category.id)
                                  ? 'bg-primary text-primary-foreground'
                                  : customCategoryHasSome(category.id)
                                  ? 'bg-primary/30 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {customCategoryHasAll(category.id) ? (
                                  <Check className="h-3 w-3" />
                                ) : customCategoryHasSome(category.id) ? (
                                  <span className="text-[10px] font-bold">−</span>
                                ) : null}
                              </div>
                            </button>

                            {/* Individual permissions */}
                            <div className="bg-muted/30 px-3 pb-2 pt-1 space-y-1">
                              {category.permissions.map((permission) => (
                                <label
                                  key={permission.id}
                                  className="flex items-center gap-3 p-2 rounded hover:bg-background cursor-pointer transition-colors"
                                >
                                  <Switch
                                    checked={customPermissions.includes(permission.id)}
                                    onCheckedChange={() => toggleCustomPermission(permission.id)}
                                    className="data-[state=checked]:bg-primary"
                                  />
                                  <div className="flex-1">
                                    <span className="text-sm">{permission.name}</span>
                                    <p className="text-xs text-muted-foreground">{permission.description}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <DialogFooter className="border-t pt-4">
              {createStep === 'customize' && (
                <Button
                  variant="outline"
                  onClick={() => setCreateStep('template')}
                  className="mr-auto"
                >
                  ← Back to Templates
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetCreateDialog();
                }}
              >
                Cancel
              </Button>
              {createStep === 'customize' && (
                <Button
                  onClick={handleCreateRole}
                  disabled={!newRoleName.trim() || createRole.isPending}
                  className="gap-2"
                >
                  {createRole.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Create Role
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Info Banner */}
      <motion.div variants={itemVariants}>
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">How to use the permissions matrix</p>
            <p className="text-muted-foreground mt-1">
              Click the <span className="font-medium">Edit</span> button next to a role to modify its permissions. 
              Toggle individual permissions or click on a category header to enable/disable all permissions in that category.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Permission Matrix */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Permissions Matrix
            </CardTitle>
            <CardDescription>
              {roles?.length || 0} roles configured with various permission levels
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <ScrollArea className="h-[600px]">
              <div className="min-w-[900px]">
                {/* Header row with roles */}
                <div className="sticky top-0 z-10 bg-background border-b">
                  <div className="flex flex-row">
                    <div className="w-64 flex-shrink-0 p-4 border-r bg-muted/50">
                      <span className="font-semibold text-sm">Permissions</span>
                    </div>
                    <div className="flex flex-row flex-1">
                      {isLoading ? (
                      Array.from({ length: 3 }).map((_, i: number) => (
                        <div key={i} className="flex-1 min-w-[140px] p-4 border-r bg-muted/50">
                          <Skeleton className="h-6 w-20 mx-auto" aria-hidden="true" />
                        </div>
                      ))
                    ) : (
                      roles?.map((role: Role) => (
                        <div key={role.id} className="flex-1 min-w-[140px] p-4 border-r bg-muted/50">
                          <div className="flex flex-col items-center gap-2">
                            <Badge variant={getRoleBadgeVariant(role.role)} className="gap-1">
                              {role.role.toLowerCase().includes('admin') ? (
                                <ShieldCheck className="h-3 w-3" />
                              ) : (
                                <Shield className="h-3 w-3" />
                              )}
                              {role.role}
                            </Badge>
                            {editingRole === role.id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={cancelEditing}
                                  className="h-6 w-6"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="default"
                                  size="icon-sm"
                                  onClick={() => saveChanges(role)}
                                  disabled={isSaving}
                                  className="h-6 w-6"
                                >
                                  {isSaving ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Save className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEditing(role)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                {!role.role.toLowerCase().includes('admin') && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon-sm"
                                          onClick={() => handleDeleteRole(role)}
                                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Delete role</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    </div>
                  </div>
                </div>

                {/* Permission categories and rows */}
                {permissionCategories.map((category) => (
                  <div key={category.id}>
                    {/* Category header */}
                    <div className="flex flex-row bg-muted/30 border-b">
                      <div className="w-64 flex-shrink-0 p-3 border-r">
                        <div className="flex items-center gap-2">
                          <category.icon className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm">{category.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {category.description}
                        </p>
                      </div>
                      <div className="flex flex-row flex-1">
                        {roles?.map((role: Role) => {
                          const { enabled, total } = getCategoryPermissionCount(role, category.id);
                          return (
                            <div
                              key={role.id}
                              className="flex-1 min-w-[150px] p-3 border-r flex items-center justify-center"
                            >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => toggleCategory(role.id, category.id)}
                                    disabled={editingRole !== role.id}
                                    className={`flex items-center justify-center h-8 w-8 rounded-lg transition-all ${
                                      editingRole === role.id
                                        ? 'cursor-pointer hover:bg-primary/10'
                                        : 'cursor-default'
                                    } ${
                                      categoryHasAll(role, category.id)
                                        ? 'bg-primary/10 text-primary'
                                        : categoryHasSome(role, category.id)
                                        ? 'bg-primary/5 text-primary/60'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    {categoryHasAll(role, category.id) ? (
                                      <Check className="h-5 w-5" />
                                    ) : categoryHasSome(role, category.id) ? (
                                      <span className="text-xs font-medium">
                                        {enabled}/{total}
                                      </span>
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {categoryHasAll(role, category.id)
                                    ? `All ${category.name} permissions enabled`
                                    : categoryHasSome(role, category.id)
                                    ? `${enabled} of ${total} permissions enabled`
                                    : `No ${category.name} permissions`}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Individual permissions */}
                    {category.permissions.map((permission, permIdx: number) => (
                      <div
                        key={permission.id}
                        className={`flex flex-row border-b ${
                          permIdx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                        }`}
                      >
                        <div className="w-64 flex-shrink-0 p-3 pl-8 border-r">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-help">
                                  <span className="text-sm">{permission.name}</span>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {permission.description}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="flex flex-row flex-1">
                          {roles?.map((role: Role) => (
                            <div
                              key={role.id}
                              className="flex-1 min-w-[150px] p-3 border-r flex items-center justify-center"
                            >
                              <Switch
                                checked={hasPermission(role, permission.id)}
                                onCheckedChange={() => togglePermission(role.id, permission.id)}
                                disabled={editingRole !== role.id}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6">
              <span className="text-sm font-medium text-foreground">Legend:</span>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                  <Check className="h-4 w-4" />
                </div>
                <span className="text-sm text-muted-foreground">All permissions in category</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/5 text-primary/60">
                  <span className="text-xs font-medium">2/5</span>
                </div>
                <span className="text-sm text-muted-foreground">Some permissions in category</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground">
                  <X className="h-4 w-4" />
                </div>
                <span className="text-sm text-muted-foreground">No permissions in category</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
