import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Key,
  Type,
  Calendar,
  ToggleLeft,
  Layers,
  Hash,
  Table2,
  Building2,
  Database,
  Users,
  Shield,
  MessageSquare,
  FileText,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table';
import { motion } from 'motion/react';

interface ColumnDef {
  name: string;
  display: string;
  type: string;
  required: boolean;
  icon: React.ElementType;
  details: string;
}

interface TableDef {
  id: string;
  name: string;
  logical: string;
  columns: ColumnDef[];
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } },
} as const;

const tableDefinitions: TableDef[] = [
  {
    id: 'Ticket',
    name: 'Ticket',
    logical: 'cr5c2_ticket',
    icon: Table2,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    columns: [
      { name: 'cr5c2_ticketid', display: 'Ticket ID', type: 'UniqueIdentifier', required: true, icon: Key, details: 'Primary key' },
      { name: 'cr5c2_ticketnumber', display: 'Ticket Number', type: 'String', required: true, icon: Hash, details: 'Max: 850 chars' },
      { name: 'cr5c2_title', display: 'Title', type: 'String', required: true, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_description', display: 'Description', type: 'Memo', required: true, icon: Type, details: 'Max: 2000 chars' },
      { name: 'cr5c2_status', display: 'Status', type: 'Picklist', required: true, icon: ToggleLeft, details: 'Choice field' },
      { name: 'cr5c2_priority', display: 'Priority', type: 'Picklist', required: true, icon: ToggleLeft, details: 'Choice field' },
      { name: 'cr5c2_maincategory', display: 'Main Category', type: 'String', required: true, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_subcategory', display: 'Subcategory', type: 'String', required: true, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_createdby', display: 'Created By', type: 'String', required: true, icon: Type, details: 'User reference' },
      { name: 'cr5c2_createddate', display: 'Created Date', type: 'DateTime', required: true, icon: Calendar, details: 'User local time' },
      { name: 'cr5c2_sladuedate', display: 'SLA Due Date', type: 'DateTime', required: false, icon: Calendar, details: 'User local time' },
      { name: 'cr5c2_assignedto', display: 'Assigned To', type: 'String', required: false, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_company', display: 'Company', type: 'Lookup', required: false, icon: Layers, details: 'Reference to Company' },
      { name: 'cr5c2_department', display: 'Department', type: 'Lookup', required: false, icon: Layers, details: 'Reference to Department' },
      { name: 'cr5c2_raisedbyname', display: 'Raised By Name', type: 'String', required: false, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_requesteremail', display: 'Requester Email', type: 'String', required: false, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_mobilenumber', display: 'Mobile Number', type: 'String', required: false, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_attachmenturl', display: 'Attachment URL', type: 'String', required: false, icon: Type, details: 'URL format' },
    ],
  },
  {
    id: 'Company',
    name: 'Company',
    logical: 'cr5c2_company',
    icon: Building2,
    iconBg: 'bg-accent/20',
    iconColor: 'text-accent-foreground',
    columns: [
      { name: 'cr5c2_companyid', display: 'Company ID', type: 'UniqueIdentifier', required: true, icon: Key, details: 'Primary key' },
      { name: 'cr5c2_name', display: 'Name', type: 'String', required: true, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_address', display: 'Address', type: 'Memo', required: false, icon: Type, details: 'Max: 2000 chars' },
      { name: 'cr5c2_contactemail', display: 'Contact Email', type: 'String', required: false, icon: Type, details: 'Email format' },
      { name: 'cr5c2_phone', display: 'Phone', type: 'String', required: false, icon: Type, details: 'Max: 50 chars' },
      { name: 'cr5c2_industry', display: 'Industry', type: 'String', required: false, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_website', display: 'Website', type: 'String', required: false, icon: Type, details: 'URL format' },
    ],
  },
  {
    id: 'Department',
    name: 'Department',
    logical: 'cr5c2_department',
    icon: Database,
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    columns: [
      { name: 'cr5c2_departmentid', display: 'Department ID', type: 'UniqueIdentifier', required: true, icon: Key, details: 'Primary key' },
      { name: 'cr5c2_name', display: 'Name', type: 'String', required: true, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_description', display: 'Description', type: 'Memo', required: false, icon: Type, details: 'Max: 2000 chars' },
      { name: 'cr5c2_company', display: 'Company', type: 'Lookup', required: false, icon: Layers, details: 'Reference to Company' },
    ],
  },
  {
    id: 'AppUser',
    name: 'AppUser',
    logical: 'cr5c2_appuser',
    icon: Users,
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    columns: [
      { name: 'cr5c2_appuserid', display: 'AppUser ID', type: 'UniqueIdentifier', required: true, icon: Key, details: 'Primary key' },
      { name: 'cr5c2_displayname', display: 'Display Name', type: 'String', required: true, icon: Type, details: 'Max: 200 chars' },
      { name: 'cr5c2_email', display: 'Email', type: 'String', required: true, icon: Type, details: 'Email format' },
      { name: 'cr5c2_role', display: 'Role', type: 'Lookup', required: false, icon: Layers, details: 'Reference to Role' },
      { name: 'cr5c2_department', display: 'Department', type: 'String', required: false, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_company', display: 'Company', type: 'String', required: false, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_isactive', display: 'Is Active', type: 'Boolean', required: false, icon: ToggleLeft, details: 'Yes/No' },
      { name: 'cr5c2_phonenumber', display: 'Phone Number', type: 'String', required: false, icon: Type, details: 'Max: 50 chars' },
      { name: 'cr5c2_jobtitle', display: 'Job Title', type: 'String', required: false, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_lastlogindate', display: 'Last Login Date', type: 'DateTime', required: false, icon: Calendar, details: 'User local time' },
      { name: 'cr5c2_profileimageurl', display: 'Profile Image URL', type: 'String', required: false, icon: Type, details: 'URL format' },
      { name: 'cr5c2_permissions', display: 'Permissions', type: 'Memo', required: false, icon: Type, details: 'JSON format' },
    ],
  },
  {
    id: 'Role',
    name: 'Role',
    logical: 'cr5c2_role',
    icon: Shield,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    columns: [
      { name: 'cr5c2_roleid', display: 'Role ID', type: 'UniqueIdentifier', required: true, icon: Key, details: 'Primary key' },
      { name: 'cr5c2_name', display: 'Name', type: 'String', required: true, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_description', display: 'Description', type: 'Memo', required: false, icon: Type, details: 'Max: 2000 chars' },
      { name: 'cr5c2_permissions', display: 'Permissions', type: 'Memo', required: false, icon: Type, details: 'JSON format' },
    ],
  },
  {
    id: 'TicketComment',
    name: 'TicketComment',
    logical: 'cr5c2_ticketcomment',
    icon: MessageSquare,
    iconBg: 'bg-accent/20',
    iconColor: 'text-accent-foreground',
    columns: [
      { name: 'cr5c2_ticketcommentid', display: 'Comment ID', type: 'UniqueIdentifier', required: true, icon: Key, details: 'Primary key' },
      { name: 'cr5c2_ticket', display: 'Ticket', type: 'Lookup', required: true, icon: Layers, details: 'Reference to Ticket' },
      { name: 'cr5c2_content', display: 'Content', type: 'Memo', required: true, icon: Type, details: 'Max: 4000 chars' },
      { name: 'cr5c2_author', display: 'Author', type: 'String', required: true, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_createdon', display: 'Created On', type: 'DateTime', required: true, icon: Calendar, details: 'User local time' },
      { name: 'cr5c2_isinternal', display: 'Is Internal', type: 'Boolean', required: false, icon: ToggleLeft, details: 'Yes/No' },
    ],
  },
  {
    id: 'KnowledgeArticle',
    name: 'KnowledgeArticle',
    logical: 'cr5c2_knowledgearticle',
    icon: FileText,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    columns: [
      { name: 'cr5c2_knowledgearticleid', display: 'Article ID', type: 'UniqueIdentifier', required: true, icon: Key, details: 'Primary key' },
      { name: 'cr5c2_title', display: 'Title', type: 'String', required: true, icon: Type, details: 'Max: 200 chars' },
      { name: 'cr5c2_content', display: 'Content', type: 'Memo', required: true, icon: Type, details: 'Rich text content' },
      { name: 'cr5c2_category', display: 'Category', type: 'String', required: false, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_tags', display: 'Tags', type: 'String', required: false, icon: Type, details: 'Comma-separated' },
      { name: 'cr5c2_author', display: 'Author', type: 'String', required: false, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_createdon', display: 'Created On', type: 'DateTime', required: false, icon: Calendar, details: 'User local time' },
      { name: 'cr5c2_viewcount', display: 'View Count', type: 'Integer', required: false, icon: Hash, details: 'Default: 0' },
    ],
  },
  {
    id: 'AppSetting',
    name: 'AppSetting',
    logical: 'cr5c2_appsetting',
    icon: Settings,
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    columns: [
      { name: 'cr5c2_appsettingid', display: 'Setting ID', type: 'UniqueIdentifier', required: true, icon: Key, details: 'Primary key' },
      { name: 'cr5c2_settingkey', display: 'Setting Key', type: 'String', required: true, icon: Type, details: 'Max: 100 chars' },
      { name: 'cr5c2_settingvalue', display: 'Setting Value', type: 'String', required: false, icon: Type, details: 'Max: 2000 chars' },
      { name: 'cr5c2_description', display: 'Description', type: 'Memo', required: false, icon: Type, details: 'Max: 500 chars' },
    ],
  },
];

export function TableSchemaViewer() {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleTable = (tableId: string, open: boolean) => {
    const newSet = new Set(expandedTables);
    if (open) newSet.add(tableId);
    else newSet.delete(tableId);
    setExpandedTables(newSet);
  };

  const toggleAll = () => {
    if (expandedTables.size === tableDefinitions.length) {
      setExpandedTables(new Set());
    } else {
      setExpandedTables(new Set(tableDefinitions.map((t: TableDef) => t.id)));
    }
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Table Schema Viewer
              </CardTitle>
              <CardDescription>View detailed column information for each Dataverse table</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
              className="gap-2"
            >
              {expandedTables.size === tableDefinitions.length ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tableDefinitions.map((tableDef: TableDef) => {
              const TableIcon = tableDef.icon;
              return (
                <Collapsible
                  key={tableDef.id}
                  open={expandedTables.has(tableDef.id)}
                  onOpenChange={(open: boolean) => toggleTable(tableDef.id, open)}
                >
                  <div className="rounded-xl border overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg ${tableDef.iconBg} flex items-center justify-center`}>
                            <TableIcon className={`h-5 w-5 ${tableDef.iconColor}`} />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">{tableDef.name}</p>
                            <p className="text-xs text-muted-foreground">{tableDef.logical} • {tableDef.columns.length} columns</p>
                          </div>
                        </div>
                        {expandedTables.has(tableDef.id) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t bg-muted/20">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-xs font-semibold">Column Name</TableHead>
                              <TableHead className="text-xs font-semibold">Display Name</TableHead>
                              <TableHead className="text-xs font-semibold">Type</TableHead>
                              <TableHead className="text-xs font-semibold">Required</TableHead>
                              <TableHead className="text-xs font-semibold">Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableDef.columns.map((col: ColumnDef) => {
                              const ColIcon = col.icon;
                              return (
                                <TableRow key={col.name} className="hover:bg-muted/30">
                                  <TableCell className="font-mono text-xs">{col.name}</TableCell>
                                  <TableCell className="text-sm">{col.display}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">{col.type}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {col.required ? (
                                      <Badge className="bg-primary text-primary-foreground text-xs">Required</Badge>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">Optional</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <ColIcon className="h-3 w-3" />
                                      {col.details}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
