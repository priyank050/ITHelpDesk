import { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, Plus, Edit, Trash2, Search, Phone, Mail, MapPin, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
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
import { useCompanyList, useCreateCompany, useUpdateCompany, useDeleteCompany } from './generated/hooks/use-company';
import { useTicketList } from './generated/hooks/use-ticket';
import { useDepartmentList } from './generated/hooks/use-department';
import type { Company } from './generated/models/company-model';
import type { Ticket } from './generated/models/ticket-model';
import type { Department } from './generated/models/department-model';
import { toast } from 'sonner';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Research & Development',
  'Other',
];

export default function CompaniesPage() {
  const { data: companies = [], isLoading } = useCompanyList();
  const { data: tickets = [] } = useTicketList();
  const { data: departments = [] } = useDepartmentList();
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [formData, setFormData] = useState({
    name1: '',
    ticketPrefix: '',
    industry: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    isActive: true,
  });

  const filteredCompanies = companies.filter((company: Company) =>
    company.name1.toLowerCase().includes(search.toLowerCase()) ||
    (company.ticketPrefix && company.ticketPrefix.toLowerCase().includes(search.toLowerCase())) ||
    (company.industry && company.industry.toLowerCase().includes(search.toLowerCase()))
  );

  const getCompanyStats = (companyId: string) => {
    const companyTickets = tickets.filter((t: Ticket) => t.company?.id === companyId);
    const companyDepts = departments.filter((d: Department) => d.company?.id === companyId);
    return {
      ticketCount: companyTickets.length,
      departmentCount: companyDepts.length,
      openTickets: companyTickets.filter((t: Ticket) => t.statusKey !== 'StatusKey2' && t.statusKey !== 'StatusKey3').length,
    };
  };

  const resetForm = () => {
    setFormData({
      name1: '',
      ticketPrefix: '',
      industry: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      isActive: true,
    });
  };

  const handleAdd = async () => {
    if (!formData.name1 || !formData.ticketPrefix) {
      toast.error('Company name and ticket prefix are required');
      return;
    }

    try {
      await createCompany.mutateAsync({
        name1: formData.name1,
        ticketPrefix: formData.ticketPrefix.toUpperCase(),
        industry: formData.industry || undefined,
        address: formData.address || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        isActive: formData.isActive,

      });
      toast.success('Company added successfully');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: unknown) {
      toast.error('Failed to add company');
    }
  };

  const handleEdit = async () => {
    if (!selectedCompany) return;

    try {
      await updateCompany.mutateAsync({
        id: selectedCompany.id,
        changedFields: {
          name1: formData.name1,
          ticketPrefix: formData.ticketPrefix.toUpperCase(),
          industry: formData.industry || undefined,
          address: formData.address || undefined,
          contactEmail: formData.contactEmail || undefined,
          contactPhone: formData.contactPhone || undefined,
          isActive: formData.isActive,
        },
      });
      toast.success('Company updated successfully');
      setIsEditDialogOpen(false);
      setSelectedCompany(null);
      resetForm();
    } catch (error: unknown) {
      toast.error('Failed to update company');
    }
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;

    try {
      await deleteCompany.mutateAsync(selectedCompany.id);
      toast.success('Company deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedCompany(null);
    } catch (error: unknown) {
      toast.error('Failed to delete company');
    }
  };

  const openEditDialog = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name1: company.name1,
      ticketPrefix: company.ticketPrefix || '',
      industry: company.industry || '',
      address: company.address || '',
      contactEmail: company.contactEmail || '',
      contactPhone: company.contactPhone || '',
      isActive: company.isActive ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (company: Company) => {
    setSelectedCompany(company);
    setIsDeleteDialogOpen(true);
  };

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
            <Building2 className="h-6 w-6 text-primary" />
            Companies
          </h1>
          <p className="text-sm text-muted-foreground">Manage client companies and their ticket prefixes</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies by name, prefix, or industry..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-primary">{companies.length}</p>
            <p className="text-xs text-muted-foreground">Total Companies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">
              {companies.filter((c: Company) => c.isActive).length}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-muted-foreground">
              {companies.filter((c: Company) => !c.isActive).length}
            </p>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
            <p className="text-xs text-muted-foreground">Total Departments</p>
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      {isLoading ? (
        <div className="space-y-4" aria-hidden="true">
          {[1, 2, 3].map((i: number) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyTitle>No companies found</EmptyTitle>
            <EmptyDescription>
              {companies.length === 0
                ? 'Add your first company to get started.'
                : 'No companies match your search.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Desktop Table */}
          <Card className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Company</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Departments</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company: Company) => {
                  const stats = getCompanyStats(company.id);
                  return (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{company.name1}</p>
                            {company.address && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {company.address.substring(0, 30)}...
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {company.ticketPrefix}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {company.industry || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {company.contactEmail && (
                            <p className="text-xs flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {company.contactEmail}
                            </p>
                          )}
                          {company.contactPhone && (
                            <p className="text-xs flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {company.contactPhone}
                            </p>
                          )}
                          {!company.contactEmail && !company.contactPhone && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="font-medium">{stats.ticketCount}</p>
                          {stats.openTickets > 0 && (
                            <p className="text-xs text-primary">{stats.openTickets} open</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{stats.departmentCount}</span>
                      </TableCell>
                      <TableCell>
                        {company.isActive ? (
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
                            <DropdownMenuItem onClick={() => openEditDialog(company)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(company)}
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
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredCompanies.map((company: Company) => {
              const stats = getCompanyStats(company.id);
              return (
                <Card key={company.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{company.name1}</p>
                          <Badge variant="outline" className="font-mono text-xs mt-1">
                            {company.ticketPrefix}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(company)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(company)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-lg font-bold">{stats.ticketCount}</p>
                        <p className="text-xs text-muted-foreground">Tickets</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-lg font-bold">{stats.departmentCount}</p>
                        <p className="text-xs text-muted-foreground">Depts</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        {company.isActive ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                        )}
                        <p className="text-xs text-muted-foreground">
                          {company.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Add Company Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>
              Add a new client company with a unique ticket prefix.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name1">Company Name *</Label>
                <Input
                  id="name1"
                  value={formData.name1}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, name1: e.target.value })
                  }
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <Label htmlFor="ticketPrefix">Ticket Prefix *</Label>
                <Input
                  id="ticketPrefix"
                  value={formData.ticketPrefix}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, ticketPrefix: e.target.value.toUpperCase() })
                  }
                  placeholder="ACM"
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.industry || 'none'}
                  onValueChange={(val: string) =>
                    setFormData({ ...formData, industry: val === 'none' ? '' : val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    {INDUSTRIES.map((ind: string) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="123 Business St, City, Country"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  placeholder="contact@company.com"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>
              Update company details and ticket prefix.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-name1">Company Name *</Label>
                <Input
                  id="edit-name1"
                  value={formData.name1}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, name1: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-ticketPrefix">Ticket Prefix *</Label>
                <Input
                  id="edit-ticketPrefix"
                  value={formData.ticketPrefix}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, ticketPrefix: e.target.value.toUpperCase() })
                  }
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="edit-industry">Industry</Label>
                <Select
                  value={formData.industry || 'none'}
                  onValueChange={(val: string) =>
                    setFormData({ ...formData, industry: val === 'none' ? '' : val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    {INDUSTRIES.map((ind: string) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={formData.address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="edit-contactEmail">Contact Email</Label>
                <Input
                  id="edit-contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-contactPhone">Contact Phone</Label>
                <Input
                  id="edit-contactPhone"
                  value={formData.contactPhone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2">
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
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCompany?.name1}"? This action cannot be undone.
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
