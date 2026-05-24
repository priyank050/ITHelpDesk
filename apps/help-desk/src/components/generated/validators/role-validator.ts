import { z } from 'zod';

/**
 * Zod schema for Role validation
 */
export const RoleSchema = z.object({
  id: z.string().uuid(),
  role: z.string().min(1, { message: "Role is required" }),
});

/**
 * Schema for creating a new Role (omits system-generated ID)
 */
export const CreateRoleSchema = RoleSchema.omit({ id: true });

/**
 * Schema for updating an existing Role
 */
export const UpdateRoleSchema = RoleSchema;

export type RoleInput = z.infer<typeof RoleSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;