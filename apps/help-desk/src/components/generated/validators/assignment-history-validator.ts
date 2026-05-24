import { z } from 'zod';

/**
 * Zod schema for AssignmentHistory validation
 */
export const AssignmentHistorySchema = z.object({
  id: z.string().uuid(),
  assignedTo: z.string().min(1, { message: "Assigned To is required" }),
  assignedBy: z.string().min(1, { message: "Assigned By is required" }),
  assignedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Assigned Date is required" }),
  notes: z.string().optional(),
  previousAssignee: z.string().optional(),
  ticket: z.object({ id: z.string().uuid(), ticketNumber: z.string() }),
});

/**
 * Schema for creating a new AssignmentHistory (omits system-generated ID)
 */
export const CreateAssignmentHistorySchema = AssignmentHistorySchema.omit({ id: true });

/**
 * Schema for updating an existing AssignmentHistory
 */
export const UpdateAssignmentHistorySchema = AssignmentHistorySchema;

export type AssignmentHistoryInput = z.infer<typeof AssignmentHistorySchema>;
export type CreateAssignmentHistoryInput = z.infer<typeof CreateAssignmentHistorySchema>;
export type UpdateAssignmentHistoryInput = z.infer<typeof UpdateAssignmentHistorySchema>;