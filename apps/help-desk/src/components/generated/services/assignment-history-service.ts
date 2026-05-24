import { getClient } from '../../../app-gen-sdk/data';
import type { AssignmentHistory } from '../models/assignment-history-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'AssignmentHistory';

export class AssignmentHistoryService {
  static async create(record: Omit<AssignmentHistory, 'id'>): Promise<AssignmentHistory> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as AssignmentHistory;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<AssignmentHistory, 'id'>>
  ): Promise<AssignmentHistory> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as AssignmentHistory;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<AssignmentHistory> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as AssignmentHistory;
  }

  static async getAll(options?: IOperationOptions): Promise<AssignmentHistory[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as AssignmentHistory[];
  }
}