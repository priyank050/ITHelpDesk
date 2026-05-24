import { z } from 'zod';

/**
 * Zod schema for Comment validation
 */
export const CommentSchema = z.object({
  id: z.string().uuid(),
  commentText: z.string().min(1, { message: "Comment Text is required" }),
  author: z.string().min(1, { message: "Author is required" }),
  content: z.string().min(1, { message: "Content is required" }),
  createdDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created Date is required" }),
  isInternalNote: z.boolean(),
  ticket: z.object({ id: z.string().uuid(), ticketNumber: z.string() }),
});

/**
 * Schema for creating a new Comment (omits system-generated ID)
 */
export const CreateCommentSchema = CommentSchema.omit({ id: true });

/**
 * Schema for updating an existing Comment
 */
export const UpdateCommentSchema = CommentSchema;

export type CommentInput = z.infer<typeof CommentSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>;