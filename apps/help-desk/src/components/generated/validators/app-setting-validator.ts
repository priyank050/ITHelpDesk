import { z } from 'zod';

/**
 * Zod schema for AppSetting validation
 */
export const AppSettingSchema = z.object({
  id: z.string().uuid(),
  settingKey: z.string().min(1, { message: "Setting Key is required" }),
  settingType: z.string().optional(),
  settingValue: z.string().min(1, { message: "Setting Value is required" }),
  updatedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
});

/**
 * Schema for creating a new AppSetting (omits system-generated ID)
 */
export const CreateAppSettingSchema = AppSettingSchema.omit({ id: true });

/**
 * Schema for updating an existing AppSetting
 */
export const UpdateAppSettingSchema = AppSettingSchema;

export type AppSettingInput = z.infer<typeof AppSettingSchema>;
export type CreateAppSettingInput = z.infer<typeof CreateAppSettingSchema>;
export type UpdateAppSettingInput = z.infer<typeof UpdateAppSettingSchema>;