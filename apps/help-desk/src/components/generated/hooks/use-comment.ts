import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CommentService } from "../services/comment-service";
import type { Comment } from "../models/comment-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Comment records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, commentText, author, content, createdDate, isInternalNote
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useCommentList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["comment-list", options],
    queryFn: () => CommentService.getAll(options),
  });
}

/**
 * Retrieve a single Comment record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useComment(id: string) {
  return useQuery({
    queryKey: ["comment", id],
    queryFn: () => CommentService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Comment record.
 * @remarks Form validation: use CreateCommentSchema with zodResolver for type-safe create forms
 */
export function useCreateComment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Comment, "id">) => CommentService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["comment-list"] });
    },
  });
}

/**
 * Update an existing Comment record.
 * @remarks Form validation: use UpdateCommentSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateComment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Comment, "id">>;
    }) => CommentService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["comment-list"] });
      client.invalidateQueries({ queryKey: ["comment", variables.id] });
    },
  });
}

/**
 * Delete a Comment record by its unique identifier.
 */
export function useDeleteComment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => CommentService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["comment-list"] });
      client.invalidateQueries({ queryKey: ["comment", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Comment_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { CommentSchema, CreateCommentSchema, UpdateCommentSchema } from "../validators/comment-validator";
export type { CommentInput, CreateCommentInput, UpdateCommentInput } from "../validators/comment-validator";