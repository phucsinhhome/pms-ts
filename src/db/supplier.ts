export const listSupplierInvoices = (createdTime: string, page: number, size: number) => {
  console.info("Fetching supplier invoices from backend")
  const opts = {
    method: 'GET'
  }
  return fetch(`${process.env.REACT_APP_SUPPLIER_ENDPOINT}/invoice/list?createdTime=${createdTime}&page=${page}&size=${size}`, opts);
}
