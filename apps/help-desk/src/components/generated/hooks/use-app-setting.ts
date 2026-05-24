import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppSettingService } from "../services/app-setting-service";
import type { AppSetting } from "../models/app-setting-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AppSetting records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, settingKey, settingType, settingValue, updatedDate
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAppSettingList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["appSetting-list", options],
    queryFn: () => AppSettingService.getAll(options),
  });
}

/**
 * Retrieve a single AppSetting record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAppSetting(id: string) {
  return useQuery({
    queryKey: ["appSetting", id],
    queryFn: () => AppSettingService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AppSetting record.
 * @remarks Form validation: use CreateAppSettingSchema with zodResolver for type-safe create forms
 */
export function useCreateAppSetting() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AppSetting, "id">) => AppSettingService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["appSetting-list"] });
    },
  });
}

/**
 * Update an existing AppSetting record.
 * @remarks Form validation: use UpdateAppSettingSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAppSetting() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AppSetting, "id">>;
    }) => AppSettingService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["appSetting-list"] });
      client.invalidateQueries({ queryKey: ["appSetting", variables.id] });
    },
  });
}

/**
 * Delete a AppSetting record by its unique identifier.
 */
export function useDeleteAppSetting() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AppSettingService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["appSetting-list"] });
      client.invalidateQueries({ queryKey: ["appSetting", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const AppSetting_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { AppSettingSchema, CreateAppSettingSchema, UpdateAppSettingSchema } from "../validators/app-setting-validator";
export type { AppSettingInput, CreateAppSettingInput, UpdateAppSettingInput } from "../validators/app-setting-validator";