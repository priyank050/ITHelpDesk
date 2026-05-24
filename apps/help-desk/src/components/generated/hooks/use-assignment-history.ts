import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AssignmentHistoryService } from "../services/assignment-history-service";
import type { AssignmentHistory } from "../models/assignment-history-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AssignmentHistory records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, assignedTo, assignedBy, assignedDate, notes, previousAssignee
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAssignmentHistoryList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["assignmentHistory-list", options],
    queryFn: () => AssignmentHistoryService.getAll(options),
  });
}

/**
 * Retrieve a single AssignmentHistory record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAssignmentHistory(id: string) {
  return useQuery({
    queryKey: ["assignmentHistory", id],
    queryFn: () => AssignmentHistoryService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AssignmentHistory record.
 * @remarks Form validation: use CreateAssignmentHistorySchema with zodResolver for type-safe create forms
 */
export function useCreateAssignmentHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AssignmentHistory, "id">) => AssignmentHistoryService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["assignmentHistory-list"] });
    },
  });
}

/**
 * Update an existing AssignmentHistory record.
 * @remarks Form validation: use UpdateAssignmentHistorySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAssignmentHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AssignmentHistory, "id">>;
    }) => AssignmentHistoryService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["assignmentHistory-list"] });
      client.invalidateQueries({ queryKey: ["assignmentHistory", variables.id] });
    },
  });
}

/**
 * Delete a AssignmentHistory record by its unique identifier.
 */
export function useDeleteAssignmentHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AssignmentHistoryService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["assignmentHistory-list"] });
      client.invalidateQueries({ queryKey: ["assignmentHistory", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const AssignmentHistory_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { AssignmentHistorySchema, CreateAssignmentHistorySchema, UpdateAssignmentHistorySchema } from "../validators/assignment-history-validator";
export type { AssignmentHistoryInput, CreateAssignmentHistoryInput, UpdateAssignmentHistoryInput } from "../validators/assignment-history-validator";