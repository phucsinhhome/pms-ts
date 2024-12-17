export const Configs = {
  logo: process.env.REACT_APP_PS_LOGO
}

const requestOptions = {
  method: 'GET'
}

export const exportInvoice = (invoice) => {
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

export const updateInvoice = (invoice) => {
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

export const deleteInvoice = (invoice) => {
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

export const listLatestInvoices = (pageNumber, pageSize) => {
  console.info("Fetching invoices from backend")
  return fetch(`${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}/list/recent?page=${pageNumber}&size=${pageSize}`, requestOptions)
    .then(response => response.json())
}

export const listStayingAndComingInvoices = (fromDate, pageNumber, pageSize) => {
  console.info("Fetching invoices from backend include prepaid")
  return listStayingAndComingInvoicesAndPrepaid(fromDate, true, pageNumber, pageSize)
}

export const listStayingAndComingInvoicesAndPrepaid = (fromDate, includePrepaid, pageNumber, pageSize) => {
  console.info("Fetching invoices from backend")

  var opts = {
    method: 'GET'
  }

  return fetch(`${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}/list/upcoming?fromDate=${fromDate}&includePrepaid=${includePrepaid}&page=${pageNumber}&size=${pageSize}`, opts)
}

export const listInvoiceByGuestName = (fromDate, guestName, pageNumber, pageSize) => {
  console.info("Fetching invoices by guest name")

  var opts = {
    method: 'GET'
  }

  return fetch(`${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}/search/name?fromDate=${fromDate}&guestName=${guestName}&page=${pageNumber}&size=${pageSize}`, opts)
}

export function getInvoice(invoiceId) {
  console.info("Fetching invoice from backend")
  return fetch(`${process.env.REACT_APP_INVOICE_SERVICE_ENDPOINT}/${invoiceId}`, requestOptions)
    .then(response => response.json())
}

export const listPaymentMethods = [
  {
    id: "cash",
    name: "Cash",
    feeRate: 0,
    template: "invoice_without_transfer_fee",
    src: <svg
      class="w-6 h-6 text-gray-800 dark:text-white"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path fill-rule="evenodd" d="M7 6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2v-4a3 3 0 0 0-3-3H7V6Z" clip-rule="evenodd" />
      <path fill-rule="evenodd" d="M2 11a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7Zm7.5 1a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" clip-rule="evenodd" />
      <path d="M10.5 14.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
    </svg>,
    srcLargeImg: "/cash.svg",
    paymentInfo: "/payment/cash.jpeg",
    defaultIssuerId: "6456500785"
  },
  {
    id: "creditCard",
    name: "Credit Card",
    feeRate: 0.025,
    template: "invoice_with_transfer_fee",
    src: <svg
      class="w-6 h-6 text-gray-800 dark:text-white"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24">
      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z" />
    </svg>,
    srcLargeImg: "/mastercard.svg",
    paymentInfo: "/payment/creditcard.jpeg",
    defaultIssuerId: "1351151927"
  },
  {
    id: "momo",
    name: "MoMo",
    feeRate: 0,
    template: "invoice_without_transfer_fee",
    src: <svg
      class="w-6 h-6 text-gray-800 dark:text-white"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24">
      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z" />
    </svg>,
    srcLargeImg: "/momo-square.png",
    paymentInfo: "/payment/mono.jpg",
    defaultIssuerId: "1351151927"
  }, {
    id: "paypal",
    name: "Paypal",
    feeRate: 0.025,
    template: "invoice_without_transfer_fee",
    src: <svg
      class="w-6 h-6 text-gray-800 dark:text-white"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24">
      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z" />
    </svg>,
    srcLargeImg: "/paypal.svg",
    paymentInfo: "/payment/paypal.png",
    defaultIssuerId: "1351151927"
  }, {
    id: "bankTransfer",
    name: "Bank Transfer",
    feeRate: 0.0,
    template: "invoice_without_transfer_fee",
    src: <svg
      class="w-6 h-6 text-gray-800 dark:text-white"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24">
      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z" />
    </svg>,
    srcLargeImg: "/bank.svg",
    paymentInfo: "/payment/bankTransfer.jpg",
    defaultIssuerId: "1351151927"
  }
]


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

export const rooms = [
  {
    id: "r1",
    name: "R1",
    rate: 450000,
    bookingName: "Bungalow with Garden View",
    src: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  },
  {
    id: "r2",
    name: "R2",
    rate: 450000,
    bookingName: "Bungalow with Garden View",
    src: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  },
  {
    id: "r3",
    name: "R3",
    rate: 450000,
    bookingName: "Bungalow with Pond View",
    src: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  }, {
    id: "r4",
    name: "R4",
    rate: 550000,
    bookingName: "Air-conditioned room with Garden View",
    src: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  }, {
    id: "r5",
    name: "R5",
    rate: 550000,
    bookingName: "Air-conditioned room with Garden View",
    src: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  }, {
    id: "r6",
    name: "R6",
    rate: 650000,
    bookingName: "Family room with Garden View",
    src: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
    </svg>
  }
]