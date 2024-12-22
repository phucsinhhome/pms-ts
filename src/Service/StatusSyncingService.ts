const requestOptions = {
    method: 'POST'
}

export const syncStatusOfMonth = (datePartittion:string) => {
    console.info("Trigger assistant service to sync the status of " + datePartittion)
    return fetch(`${process.env.REACT_APP_STATUS_ENDPOINT}/sync?partition=${datePartittion}`, requestOptions)
}