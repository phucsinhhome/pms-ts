export type REntity = {
    expense: number,
    revenue: number,
    name: string,
    displayName: string,
    profit: number
}

export type PReport = {
    fromDate: string,
    toDate: string,
    id?: string,
    overall: REntity,
    breakdown: REntity[]
}

export type Pagination = {
    pageNumber: number,
    pageSize: number,
    totalElements: number,
    totalPages: number
}