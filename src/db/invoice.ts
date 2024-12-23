import { Invoice } from "../Components/InvoiceManager";

export const Configs = {
  logo: process.env.REACT_APP_PS_LOGO
}

const requestOptions = {
  method: 'GET'
}

export const exportInvoice = (invoice: Invoice) => {
  console.info("Call API to export invoice");
  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: new Blob([JSON.stringify(invoice)])
  }

  return fetch(`${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}/export`, opts);
}

export const updateInvoice = (invoice: Invoice) => {
  console.info("Call API to update invoice");
  const opts = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: new Blob([JSON.stringify(invoice)])
  }

  return fetch(`${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}/update`, opts);
}

export function deleteInvoice(invoice: Invoice) {
  console.info("Call API to delete invoice");
  const opts = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: new Blob([JSON.stringify(invoice)])
  }

  return fetch(`${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}/delete`, opts);
}

export const listLatestInvoices = (pageNumber: number, pageSize: number) => {
  console.info("Fetching invoices from backend")
  return fetch(`${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}/list/recent?page=${pageNumber}&size=${pageSize}`, requestOptions)
    .then(response => response.json())
}

export function listStayingAndComingInvoices(fromDate: string, pageNumber: number, pageSize: number): Promise<Response> {
  console.info("Fetching invoices from backend include prepaid")
  return listStayingAndComingInvoicesAndPrepaid(fromDate, true, pageNumber, pageSize)
}

export async function listStayingAndComingInvoicesAndPrepaid(fromDate: string, includePrepaid: boolean, pageNumber: number, pageSize: number): Promise<Response> {
  console.info("Fetching invoices from backend")

  var opts = {
    method: 'GET'
  }

  return fetch(`${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}/list/upcoming?fromDate=${fromDate}&includePrepaid=${includePrepaid}&page=${pageNumber}&size=${pageSize}`, opts)
}

export const listInvoiceByGuestName = (fromDate: string, guestName: string, pageNumber: number, pageSize: number) => {
  console.info("Fetching invoices by guest name")

  var opts = {
    method: 'GET'
  }

  return fetch(`${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}/search/name?fromDate=${fromDate}&guestName=${guestName}&page=${pageNumber}&size=${pageSize}`, opts)
}

export function getInvoice(invoiceId: string) {
  console.info("Fetching invoice from backend")
  return fetch(`${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}/${invoiceId}`, requestOptions)
    .then(response => response.json())
}

export function getItemList() {
  return [
    {
      id: "R1",
      name: "Bungalow Garden View",
      price: 499000,
      group: "room",
      service: "STAY"
    },
    {
      id: "R2",
      name: "Bungalow Garden View",
      price: 499000,
      group: "room",
      service: "STAY"
    },
    {
      id: "R3",
      name: "Bungalow Lake View",
      price: 499000,
      group: "room",
      service: "STAY"
    },
    {
      id: "R4",
      name: "Airconditioned Room Garden View",
      price: 599000,
      group: "room",
      service: "STAY"
    },
    {
      id: "R5",
      name: "Airconditioned Room Garden View",
      price: 599000,
      group: "room",
      service: "STAY"
    },
    {
      id: "R6",
      name: "Family Room Garden View",
      price: 699000,
      group: "room",
      service: "STAY"
    },
    {
      id: "F1",
      name: "Pepsi",
      price: 15000,
      group: "food",
      service: "FOOD"
    },
    {
      id: "F2",
      name: "Cocacola",
      price: 15000,
      group: "food",
      service: "FOOD"
    },
    {
      id: "F3",
      name: "7up",
      price: 15000,
      group: "food",
      service: "FOOD"
    },
    {
      id: "F4",
      name: "Bia Saigon",
      price: 25000,
      group: "food",
      service: "FOOD"
    },
    {
      id: "F5",
      name: "Bia Tiger",
      price: 25000,
      group: "food",
      service: "FOOD"
    },
    {
      id: "F6",
      name: "Ăn Tối",
      price: 150000,
      group: "food",
      service: "FOOD"
    },
    {
      id: "F7",
      name: "Ăn Trưa",
      price: 150000,
      group: "food",
      service: "FOOD"
    },
    {
      id: "F8",
      name: "Ăn Sáng",
      price: 50000,
      group: "food",
      service: "FOOD"
    },
    {
      id: "T1",
      name: "Tour Mekong Nhom 2 khach",
      price: 700000,
      group: "tour",
      service: "TOUR"
    },
    {
      id: "T2",
      name: "Tour Mekong Nhom 3 khach",
      price: 600000,
      group: "tour",
      service: "TOUR"
    },
    {
      id: "T3",
      name: "Tour Mekong Nhom 4 khach",
      price: 500000,
      group: "tour",
      service: "TOUR"
    },
    {
      id: "T4",
      name: "Tour Mekong Nhom 5 khach",
      price: 450000,
      group: "tour",
      service: "TOUR"
    },
    {
      id: "T5",
      name: "Tour Mekong Nhom 6 khach",
      price: 400000,
      group: "tour",
      service: "TOUR"
    },
    {
      id: "T7",
      name: "Tour Biking Can Tho",
      price: 4000000,
      group: "tour",
      service: "TOUR"
    }
  ]
}

