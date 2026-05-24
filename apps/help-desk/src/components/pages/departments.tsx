import { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Plus, Edit, Trash2, Search, Building2, MoreHorizontal, CheckCircle, XCircle, UserCircle } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { Card, CardContent } from './components/ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from './components/ui/empty';
import { InMemoryDataBanner } from './generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from './generated/hooks';
import { useDepartmentList, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from './generated/hooks/use-department';
import { useCompanyList } from './generated/hooks/use-company';
import { useTicketList } from './generated/hooks/use-ticket';
import type { Department } from './generated/models/department-model';
import type { Company } from './generated/models/company-model';
import type { Ticket } from './generated/models/ticket-model';
import { toast } from 'sonner';

export default function DepartmentsPage() {
  const { data: departments = [], isLoading } = useDepartmentList();
  const { data: companies = [] } = useCompanyList();
  const { data: tickets = [] } = useTicketList();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const [formData, setFormData] = useState({
    name1: '',
    description: '',
    companyId: '',
    managerName: '',
    isActive: true,
  });

  const filteredDepartments = departments.filter((dept: Department) => {
    const matchesSearch =
      dept.name1.toLowerCase().includes(search.toLowerCase()) ||
      (dept.description && dept.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCompany = companyFilter === 'all' || dept.company?.id === companyFilter;
    return matchesSearch && matchesCompany;
  });

  const getDepartmentStats = (deptId: string) => {
    const deptTickets = tickets.filter((t: Ticket) => t.department?.id === deptId);
    return {
      ticketCount: deptTickets.length,
      openTickets: deptTickets.filter((t: Ticket) => t.statusKey !== 'StatusKey2' && t.statusKey !== 'StatusKey3').length,
      criticalTickets: deptTickets.filter((t: Ticket) => t.priorityKey === 'PriorityKey3').length,
    };
  };

  const getCompanyName = (company: Pick<Company, 'id' | 'name1'> | undefined) => {
    if (!company) return '-';
    return company.name1 || '-';
  };

  const resetForm = () => {
    setFormData({
      name1: '',
      description: '',
      companyId: '',
      managerName: '',
      isActive: true,
    });
  };

  const handleAdd = async () => {
    if (!formData.name1 || !formData.companyId) {
      toast.error('Department name and company are required');
      return;
    }

    const selectedCompany = companies.find((c: Company) => c.id === formData.companyId);
    if (!selectedCompany) {
      toast.error('Please select a valid company');
      return;
    }

    try {
      await createDepartment.mutateAsync({
        name1: formData.name1,
        description: formData.description || undefined,
        company: { id: selectedCompany.id, name1: selectedCompany.name1 },
        managerName: formData.managerName || undefined,
        isActive: formData.isActive,

      });
      toast.success('Department added successfully');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      toast.error('Failed to add department');
    }
  };

  const handleEdit = async () => {
    if (!selectedDepartment) return;

    const selectedCompany = companies.find((c: Company) => c.id === formData.companyId);
    if (!selectedCompany) {
      toast.error('Please select a valid company');
      return;
    }

    try {
      await updateDepartment.mutateAsync({
        id: selectedDepartment.id,
        changedFields: {
          name1: formData.name1,
          description: formData.description || undefined,
          company: { id: selectedCompany.id, name1: selectedCompany.name1 },
          managerName: formData.managerName || undefined,
          isActive: formData.isActive,
        },
      });
      toast.success('Department updated successfully');
      setIsEditDialogOpen(false);
      setSelectedDepartment(null);
      resetForm();
    } catch (error: unknown) {
      toast.error('Failed to update department');
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;

    try {
      await deleteDepartment.mutateAsync(selectedDepartment.id);
      toast.success('Department deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedDepartment(null);
    } catch (error: unknown) {
      toast.error('Failed to delete department');
    }
  };

  const openEditDialog = (dept: Department) => {
    setSelectedDepartment(dept);
    setFormData({
      name1: dept.name1,
      description: dept.description || '',
      companyId: dept.company?.id || '',
      managerName: dept.managerName || '',
      isActive: dept.isActive ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (dept: Department) => {
    setSelectedDepartment(dept);
    setIsDeleteDialogOpen(true);
  };

  // Group departments by company
  const departmentsByCompany = filteredDepartments.reduce((acc: Record<string, Department[]>, dept: Department) => {
    const companyId = dept.company?.id || 'unknown';
    if (!acc[companyId]) acc[companyId] = [];
    acc[companyId].push(dept);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <InMemoryDataBanner
        show={HAS_IN_MEMORY_TABLES}
        message="This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage."
        className="bg-accent text-accent-foreground"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Departments
          </h1>
          <p className="text-sm text-muted-foreground">Manage company departments and teams</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.filter((c: Company) => c.id).map((company: Company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-primary">{departments.length}</p>
            <p className="text-xs text-muted-foreground">Total Departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">
              {departments.filter((d: Department) => d.isActive).length}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-muted-foreground">
              {departments.filter((d: Department) => !d.isActive).length}
            </p>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">{companies.length}</p>
            <p className="text-xs text-muted-foreground">Companies</p>
          </CardContent>
        </Card>
      </div>

      {/* Departments List */}
      {isLoading ? (
        <div className="space-y-4" aria-hidden="true">
          {[1, 2, 3].map((i: number) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyTitle>No departments found</EmptyTitle>
            <EmptyDescription>
              {departments.length === 0
                ? 'Add your first department to get started.'
                : 'No departments match your filters.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {Object.entries(departmentsByCompany).map(([companyId, depts]) => {
            const companyInfo = companies.find((c: Company) => c.id === companyId);
            return (
              <Card key={companyId}>
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{companyInfo?.name1 || 'Unknown Company'}</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {depts.length} department{depts.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[200px]">Department</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Tickets</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(depts as Department[]).map((dept: Department) => {
                        const stats = getDepartmentStats(dept.id);
                        return (
                          <TableRow key={dept.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                                  <Users className="h-4 w-4 text-secondary-foreground" />
                                </div>
                                <span className="font-medium">{dept.name1}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {dept.description || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {dept.managerName ? (
                                <div className="flex items-center gap-2">
                                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{dept.managerName}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-medium">{stats.ticketCount}</span>
                                {stats.openTickets > 0 && (
                                  <span className="text-xs text-primary ml-1">({stats.openTickets} open)</span>
                                )}
                                {stats.criticalTickets > 0 && (
                                  <Badge variant="destructive" className="ml-2 text-xs">
                                    {stats.criticalTickets} critical
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {dept.isActive ? (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Inactive
                                </Badge>
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
                                  <DropdownMenuItem onClick={() => openEditDialog(dept)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openDeleteDialog(dept)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-3 space-y-3">
                  {(depts as Department[]).map((dept: Department) => {
                    const stats = getDepartmentStats(dept.id);
                    return (
                      <div key={dept.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                              <Users className="h-4 w-4 text-secondary-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{dept.name1}</p>
                              {dept.description && (
                                <p className="text-xs text-muted-foreground">{dept.description}</p>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(dept)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(dept)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm">
                              <span className="font-medium">{stats.ticketCount}</span>
                              <span className="text-muted-foreground"> tickets</span>
                            </span>
                            {stats.criticalTickets > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {stats.criticalTickets} critical
                              </Badge>
                            )}
                          </div>
                          {dept.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </motion.div>
      )}

      {/* Add Department Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
            <DialogDescription>
              Create a new department for a company.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="dept-company">Company *</Label>
              <Select
                value={formData.companyId || 'none'}
                onValueChange={(val: string) =>
                  setFormData({ ...formData, companyId: val === 'none' ? '' : val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select company...</SelectItem>
                  {companies.filter((c: Company) => c.id).map((company: Company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dept-name1">Department Name *</Label>
              <Input
                id="dept-name1"
                value={formData.name1}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name1: e.target.value })
                }
                placeholder="e.g., IT Support, HR, Finance"
              />
            </div>
            <div>
              <Label htmlFor="dept-description">Description</Label>
              <Textarea
                id="dept-description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this department"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="dept-managerName">Manager Name</Label>
              <Input
                id="dept-managerName"
                value={formData.managerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, managerName: e.target.value })
                }
                placeholder="Manager's name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-dept-company">Company *</Label>
              <Select
                value={formData.companyId || 'none'}
                onValueChange={(val: string) =>
                  setFormData({ ...formData, companyId: val === 'none' ? '' : val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select company...</SelectItem>
                  {companies.filter((c: Company) => c.id).map((company: Company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-dept-name1">Department Name *</Label>
              <Input
                id="edit-dept-name1"
                value={formData.name1}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name1: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-dept-description">Description</Label>
              <Textarea
                id="edit-dept-description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-dept-managerName">Manager Name</Label>
              <Input
                id="edit-dept-managerName"
                value={formData.managerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, managerName: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(val: string) =>
                  setFormData({ ...formData, isActive: val === 'active' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedDepartment?.name1}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
