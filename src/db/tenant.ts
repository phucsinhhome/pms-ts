// The organization (tenant) the user is working in. API endpoints configured with this
// placeholder, e.g. REACT_APP_EXPENSE_SERVICE_ENDPOINT=https://host/assistant/{tenant}/expense,
// get it replaced with the current tenant on every request (see apis.ts).
export const TENANT_PLACEHOLDER = '{tenant}'

const TENANT_KEY = 'pms.tenant'

export type Organization = {
    alias: string,
    name: string
}

const readStoredTenant = (): string | null => {
    try {
        return localStorage.getItem(TENANT_KEY)
    } catch {
        return null
    }
}

let currentTenant: string | null = readStoredTenant()

export const getTenant = () => currentTenant

export const setTenant = (tenant: string) => {
    currentTenant = tenant
    try {
        localStorage.setItem(TENANT_KEY, tenant)
    } catch {
        // storage unavailable - the choice only lasts until the next reload
    }
}

// Keeps the remembered tenant while the user is still a member of it, otherwise falls back
// to their first organization.
export const resolveTenant = (memberships: string[]): string => {
    const tenant = currentTenant && memberships.includes(currentTenant)
        ? currentTenant
        : memberships[0] || ''
    if (tenant) {
        setTenant(tenant)
    }
    return tenant
}
