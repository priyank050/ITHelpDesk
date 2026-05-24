import { getClient } from '../../../app-gen-sdk/data';
import type { AppSetting } from '../models/app-setting-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'AppSetting';

export class AppSettingService {
  static async create(record: Omit<AppSetting, 'id'>): Promise<AppSetting> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as AppSetting;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<AppSetting, 'id'>>
  ): Promise<AppSetting> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as AppSetting;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<AppSetting> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as AppSetting;
  }

  static async getAll(options?: IOperationOptions): Promise<AppSetting[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as AppSetting[];
  }
}