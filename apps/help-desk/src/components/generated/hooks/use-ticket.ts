import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TicketService } from "../services/ticket-service";
import type { Ticket } from "../models/ticket-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Ticket records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, ticketNumber, assignedTo, attachmentURL, createdBy, createdDate, description, itemDetail, mainCategory, mobileNumber, priorityKey, raisedByName, requesterEmail, sLADueDate, statusKey, subcategory, title
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useTicketList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["ticket-list", options],
    queryFn: () => TicketService.getAll(options),
  });
}

/**
 * Retrieve a single Ticket record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useTicket(id: string) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => TicketService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Ticket record.
 * @remarks Form validation: use CreateTicketSchema with zodResolver for type-safe create forms
 */
export function useCreateTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Ticket, "id">) => TicketService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["ticket-list"] });
    },
  });
}

/**
 * Update an existing Ticket record.
 * @remarks Form validation: use UpdateTicketSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Ticket, "id">>;
    }) => TicketService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["ticket-list"] });
      client.invalidateQueries({ queryKey: ["ticket", variables.id] });
    },
  });
}

/**
 * Delete a Ticket record by its unique identifier.
 */
export function useDeleteTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TicketService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["ticket-list"] });
      client.invalidateQueries({ queryKey: ["ticket", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Ticket_DATA_SOURCE_TYPE = 'Dataverse' as const;

export { TicketSchema, CreateTicketSchema, UpdateTicketSchema } from "../validators/ticket-validator";
export type { TicketInput, CreateTicketInput, UpdateTicketInput } from "../validators/ticket-validator";