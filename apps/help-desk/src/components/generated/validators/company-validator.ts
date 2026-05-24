import { z } from 'zod';

/**
 * Zod schema for Company validation
 */
export const CompanySchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  address: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  industry: z.string().optional(),
  isActive: z.boolean(),
  ticketPrefix: z.string().min(1, { message: "Ticket Prefix is required" }),
});

/**
 * Schema for creating a new Company (omits system-generated ID)
 */
export const CreateCompanySchema = CompanySchema.omit({ id: true });

/**
 * Schema for updating an existing Company
 */
export const UpdateCompanySchema = CompanySchema;

export type CompanyInput = z.infer<typeof CompanySchema>;
export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;