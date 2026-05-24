import { z } from 'zod';

/**
 * Zod schema for Users validation
 */
export const UsersSchema = z.object({
  id: z.string().uuid(),
  emailID: z.string().min(1, { message: "Email ID is required" }),
  addedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  company: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean(),
  jobTitle: z.string().optional(),
  lastLoginDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  permissions: z.string().optional(),
  phoneNumber: z.string().optional(),
  profileImageURL: z.string().url().optional(),
  role: z.string().min(1, { message: "Role is required" }),
  userName: z.string().min(1, { message: "UserName is required" }),
});

/**
 * Schema for creating a new Users (omits system-generated ID)
 */
export const CreateUsersSchema = UsersSchema.omit({ id: true });

/**
 * Schema for updating an existing Users
 */
export const UpdateUsersSchema = UsersSchema;

export type UsersInput = z.infer<typeof UsersSchema>;
export type CreateUsersInput = z.infer<typeof CreateUsersSchema>;
export type UpdateUsersInput = z.infer<typeof UpdateUsersSchema>;