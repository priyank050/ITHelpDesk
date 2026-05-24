import { z } from 'zod';

/**
 * Zod schema for Ticket validation
 */
export const TicketSchema = z.object({
  id: z.string().uuid(),
  ticketNumber: z.string().min(1, { message: "Ticket Number is required" }),
  assignedTo: z.string().optional(),
  attachmentURL: z.string().url().optional(),
  company: z.object({ id: z.string().uuid(), name1: z.string() }).optional(),
  createdBy: z.string().min(1, { message: "Created By is required" }),
  createdDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created Date is required" }),
  department: z.object({ id: z.string().uuid(), name1: z.string() }).optional(),
  description: z.string().min(1, { message: "Description is required" }),
  itemDetail: z.string().min(1, { message: "Item Detail is required" }),
  mainCategory: z.string().min(1, { message: "Main Category is required" }),
  mobileNumber: z.string().optional(),
  priorityKey: z.enum(['PriorityKey0', 'PriorityKey1', 'PriorityKey2', 'PriorityKey3']),
  raisedByName: z.string().optional(),
  requesterEmail: z.string().optional(),
  sLADueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  statusKey: z.enum(['StatusKey0', 'StatusKey1', 'StatusKey2', 'StatusKey3']),
  subcategory: z.string().min(1, { message: "Subcategory is required" }),
  title: z.string().min(1, { message: "Title is required" }),
});

/**
 * Schema for creating a new Ticket (omits system-generated ID)
 */
export const CreateTicketSchema = TicketSchema.omit({ id: true });

/**
 * Schema for updating an existing Ticket
 */
export const UpdateTicketSchema = TicketSchema;

export type TicketInput = z.infer<typeof TicketSchema>;
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;