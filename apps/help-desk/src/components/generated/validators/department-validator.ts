import { z } from 'zod';

/**
 * Zod schema for Department validation
 */
export const DepartmentSchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  company: z.object({ id: z.string().uuid(), name1: z.string() }),
  description: z.string().optional(),
  isActive: z.boolean(),
  managerName: z.string().optional(),
});

/**
 * Schema for creating a new Department (omits system-generated ID)
 */
export const CreateDepartmentSchema = DepartmentSchema.omit({ id: true });

/**
 * Schema for updating an existing Department
 */
export const UpdateDepartmentSchema = DepartmentSchema;

export type DepartmentInput = z.infer<typeof DepartmentSchema>;
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;