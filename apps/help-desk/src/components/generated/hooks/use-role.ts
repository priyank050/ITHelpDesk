import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RoleService } from "../services/role-service";
import type { Role } from "../models/role-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Role records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, role
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRoleList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["role-list", options],
    queryFn: () => RoleService.getAll(options),
  });
}

/**
 * Retrieve a single Role record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRole(id: string) {
  return useQuery({
    queryKey: ["role", id],
    queryFn: () => RoleService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Role record.
 * @remarks Form validation: use CreateRoleSchema with zodResolver for type-safe create forms
 */
export function useCreateRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Role, "id">) => RoleService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["role-list"] });
    },
  });
}

/**
 * Update an existing Role record.
 * @remarks Form validation: use UpdateRoleSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Role, "id">>;
    }) => RoleService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["role-list"] });
      client.invalidateQueries({ queryKey: ["role", variables.id] });
    },
  });
}

/**
 * Delete a Role record by its unique identifier.
 */
export function useDeleteRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RoleService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["role-list"] });
      client.invalidateQueries({ queryKey: ["role", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Role_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { RoleSchema, CreateRoleSchema, UpdateRoleSchema } from "../validators/role-validator";
export type { RoleInput, CreateRoleInput, UpdateRoleInput } from "../validators/role-validator";