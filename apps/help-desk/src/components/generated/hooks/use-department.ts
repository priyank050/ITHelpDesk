import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DepartmentService } from "../services/department-service";
import type { Department } from "../models/department-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Department records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, description, isActive, managerName
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useDepartmentList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["department-list", options],
    queryFn: () => DepartmentService.getAll(options),
  });
}

/**
 * Retrieve a single Department record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useDepartment(id: string) {
  return useQuery({
    queryKey: ["department", id],
    queryFn: () => DepartmentService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Department record.
 * @remarks Form validation: use CreateDepartmentSchema with zodResolver for type-safe create forms
 */
export function useCreateDepartment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Department, "id">) => DepartmentService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["department-list"] });
    },
  });
}

/**
 * Update an existing Department record.
 * @remarks Form validation: use UpdateDepartmentSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateDepartment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Department, "id">>;
    }) => DepartmentService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["department-list"] });
      client.invalidateQueries({ queryKey: ["department", variables.id] });
    },
  });
}

/**
 * Delete a Department record by its unique identifier.
 */
export function useDeleteDepartment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => DepartmentService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["department-list"] });
      client.invalidateQueries({ queryKey: ["department", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Department_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { DepartmentSchema, CreateDepartmentSchema, UpdateDepartmentSchema } from "../validators/department-validator";
export type { DepartmentInput, CreateDepartmentInput, UpdateDepartmentInput } from "../validators/department-validator";