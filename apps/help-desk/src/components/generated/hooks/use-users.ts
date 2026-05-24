import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UsersService } from "../services/users-service";
import type { Users } from "../models/users-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Users records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, emailID, addedDate, company, department, isActive, jobTitle, lastLoginDate, permissions, phoneNumber, profileImageURL, role, userName
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useUsersList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["users-list", options],
    queryFn: () => UsersService.getAll(options),
  });
}

/**
 * Retrieve a single Users record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useUsers(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => UsersService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Users record.
 * @remarks Form validation: use CreateUsersSchema with zodResolver for type-safe create forms
 */
export function useCreateUsers() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Users, "id">) => UsersService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["users-list"] });
    },
  });
}

/**
 * Update an existing Users record.
 * @remarks Form validation: use UpdateUsersSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateUsers() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Users, "id">>;
    }) => UsersService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["users-list"] });
      client.invalidateQueries({ queryKey: ["users", variables.id] });
    },
  });
}

/**
 * Delete a Users record by its unique identifier.
 */
export function useDeleteUsers() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => UsersService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["users-list"] });
      client.invalidateQueries({ queryKey: ["users", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Users_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { UsersSchema, CreateUsersSchema, UpdateUsersSchema } from "../validators/users-validator";
export type { UsersInput, CreateUsersInput, UpdateUsersInput } from "../validators/users-validator";