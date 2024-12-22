import React, { useState, useEffect, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { beginOfDay, formatISODate, formatISODateTime, formatVNDateTime } from "../../Service/Utils";
import { currentUser, DEFAULT_PAGE_SIZE } from "../../App";
import { fetchOrders } from "../../db/order";
import { Button, Modal, TextInput } from "flowbite-react";
import { listInvoiceByGuestName, listStayingAndComingInvoicesAndPrepaid } from "../../db/invoice";
import { Invoice } from "../Invoice/InvoiceManager";



export enum OrderStatus {
  SENT = 'text-orange-400',
  CONFIRMED = 'text-green-700',
  REJECTED = 'text-red-700',
  SERVED = 'text-gray-700',
  EXPIRED = 'text-gray-700'
}

export type OrderItem = {
  id: string,
  name: string,
  unitPrice: number,
  quantity: number,
  featureImgUrl: string
}

export type Order = {
  orderId: string,
  id: string,
  guestName: string,
  status: OrderStatus,
  startTime: Date,
  invoiceId: string,
  items: OrderItem[]
}

export const OrderManager = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredName, setFilteredName] = useState('')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [showInvoices, setShowInvoices] = useState(false)

  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: Number(DEFAULT_PAGE_SIZE),
    totalElements: 0,
    totalPages: 0
  })

  const handlePaginationClick = (pageNumber: number) => {
    console.log("Pagination nav bar click to page %s", pageNumber)
    var pNum = pageNumber < 0 ? 0 : pageNumber > pagination.totalPages - 1 ? pagination.totalPages - 1 : pageNumber;
    var pSize = pagination.pageSize
    fetchUpcomingOrders(pNum, pSize)
  }

  const fetchUpcomingOrders = (pageNumber: number, pageSize: number) => {
    var fromTime = formatISODateTime(beginOfDay(new Date()))
    console.info("Fetch upcoming order after %s", fromTime)

    fetchOrders(fromTime, pageNumber, pageSize)
      .then((rsp: Response) => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setOrders(data.content)
              var page = {
                pageNumber: data.number,
                pageSize: data.size,
                totalElements: data.totalElements,
                totalPages: data.totalPages
              }
              setPagination(page)
            })
        }
      })
  }

  useEffect(() => {
    fetchUpcomingOrders(0, Number(DEFAULT_PAGE_SIZE));
    // eslint-disable-next-line
  }, []);

  const pageClass = (pageNum: number) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  const findTheInvoice = () => {
    let fromDate = formatISODate(new Date())
    listStayingAndComingInvoicesAndPrepaid(fromDate, false, 0, 7)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setInvoices(data.content)
            })
        }
      }).finally(() => {
        setShowInvoices(true)
      })
  }

  const hideInvoices = () => {
    setShowInvoices(false)
  }
  const changeFilteredName = (e: ChangeEvent<HTMLInputElement>) => {
    let fN = e.target.value
    setFilteredName(fN)
    if (fN === '') {
      setInvoices([])
      return
    }
    let fromDate = formatISODate(new Date())

    listInvoiceByGuestName(fromDate, fN, 0, Number(DEFAULT_PAGE_SIZE))
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setInvoices(data.content)
            })
        }
      })
  }

  const copyOrderLink = (invoice: Invoice) => {
    let url = process.env.REACT_APP_MENU_WEB_APP + '/menu/food/' + invoice.id
    navigator.clipboard.writeText(url)
    console.info("Url %s has been copied", url)
    setInvoices([])
    setShowInvoices(false)
    setFilteredName('')
  }


  return (
    <div className="h-full pt-3">
      <div className="flex flex-row items-center w-full pb-4 px-2">
        <Button onClick={findTheInvoice}>Order Link</Button>
      </div>
      <div className="h-3/5 px-2 overflow-hidden">
        <div className="flex flex-col space-y-2">
          {orders.map((order) => {
            return (
              <div
                className="flex flex-row items-center border border-gray-300 shadow-2xl rounded-md px-2 bg-white dark:bg-slate-500 "
                key={order.orderId}
              >
                <div className="w-full">
                  <div className="grid grid-cols-1">
                    <div className="flex flex-row">
                      <Link
                        to={order.id + "/" + currentUser.id}
                        state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-500 overflow-hidden"
                      >
                        {order.guestName}
                      </Link>
                    </div>
                    <div className="flex flex-row text-sm space-x-1">
                      <span className="font font-mono text-gray-500 text-[10px]">{formatVNDateTime(new Date(order.startTime))}</span>
                    </div>
                  </div>
                </div>
                <div className="pl-0.2 pr-1">
                  <div className="bg-zinc-200 rounded-md py-0.5 w-24 text-center">
                    <span className={"font font-mono font-bold " + order.status}>{order.status}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <nav className="flex items-center justify-between pt-4" aria-label="Table navigation">
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">Showing <span className="font-semibold text-gray-900 dark:text-white">{pagination.pageSize * pagination.pageNumber + 1}-{pagination.pageSize * pagination.pageNumber + pagination.pageSize}</span> of <span className="font-semibold text-gray-900 dark:text-white">{pagination.totalElements}</span></span>
        <ul className="inline-flex items-center -space-x-px">
          <li onClick={() => handlePaginationClick(pagination.pageNumber - 1)} className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          </li>
          <li onClick={() => handlePaginationClick(0)} className={pageClass(0)}>
            1
          </li>
          <li hidden={pagination.pageNumber + 1 <= 1 || pagination.pageNumber + 1 >= pagination.totalPages} aria-current="page" className={pageClass(pagination.pageNumber)}>
            {pagination.pageNumber + 1}
          </li>
          <li hidden={pagination.totalPages <= 1} onClick={() => handlePaginationClick(pagination.totalPages - 1)} className={pageClass(pagination.totalPages - 1)}>
            {pagination.totalPages}
          </li>
          <li onClick={() => handlePaginationClick(pagination.pageNumber + 1)} className="block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
          </li>
        </ul>
      </nav>


      <Modal
        show={showInvoices}
        popup={true}
        onClose={hideInvoices}
      >
        <Modal.Header />
        <Modal.Body>
          <span className="font italic">Choose guest's invoice OR...</span>
          <div className="pb-2">
            <TextInput
              id="filteredName"
              placeholder="Enter guest name to search"
              type="text"
              required={true}
              value={filteredName}
              onChange={changeFilteredName}
              className="w-full"
            />
          </div>
          <div className="flex flex-col space-y-6pb-4 sm:pb-6 lg:px-8 xl:pb-8">
            {invoices.map((invoice) => {
              return (
                <div
                  className="flex flex-row items-center border rounded-md px-2 border-gray-300 bg-white dark:bg-slate-500 "
                  key={invoice.id}
                >
                  <div className="px-0 w-full">
                    <div className="grid grid-cols-1">
                      <div className="flex flex-row">
                        <span
                          className="font-medium text-blue-600 dark:text-blue-500 overflow-hidden"
                        >
                          {invoice.guestName}
                        </span>
                      </div>
                      <div className="flex flex-row text-sm space-x-1">
                        <span className="font font-mono text-gray-500 text-[10px]">{invoice.checkInDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-300">
                    <Link to='' className="font-bold text-amber-900 px-3 py-2 hover:underline" onClick={() => copyOrderLink(invoice)}>Copy</Link>
                  </div>
                </div>
              )
            })}
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center">
          <Button onClick={hideInvoices}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
}
