export interface PowerAppsContext {
  user: {
    id: string
    name: string
    roles?: string[]
    [key: string]: any
  }
}

export function initialize(): void {
  // Local shim: no Power Apps runtime available in the browser dev environment.
}

export async function getContext(): Promise<PowerAppsContext> {
  return {
    user: {
      id: 'local-user',
      name: 'Local User',
      roles: ['admin'],
    },
  }
}
