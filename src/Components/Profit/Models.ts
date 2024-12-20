type REntity = {
    expense: number,
    revenue: number,
    name: string,
    displayName: string,
    profit: number
}

type PReport = {
    fromDate: string,
    toDate: string,
    id?: string,
    overall: REntity,
    breakdown: REntity[]
}