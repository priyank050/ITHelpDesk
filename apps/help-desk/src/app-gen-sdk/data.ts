export function getClient() {
  return {
    createRecordAsync: async (_entityName: string, record: unknown) => Promise.resolve(record),
    updateRecordAsync: async (_entityName: string, _id: string, changedFields: unknown) => Promise.resolve(changedFields),
    deleteRecordAsync: async (_entityName: string, _id: string) => Promise.resolve({}),
    retrieveRecordAsync: async (_entityName: string, _id: string) => Promise.resolve(null),
    retrieveMultipleRecordsAsync: async (_entityName: string, _options: unknown) => Promise.resolve([]),
  }
}
