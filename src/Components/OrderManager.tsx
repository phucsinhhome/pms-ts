import React, { useState, useEffect, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { beginOfDay, formatISODate, formatISODateTime, formatISOTime } from "../Service/Utils";
import { Chat, DEFAULT_PAGE_SIZE } from "../App";
import { fetchUpcomingOrders } from "../db/order";
import { Button, Modal, TextInput } from "flowbite-react";
import { getInvoice, listInvoiceByGuestName, listStayingAndComingInvoicesAndPrepaid } from "../db/invoice";
import { Invoice } from "./InvoiceManager";
import { HiMail, HiX } from "react-icons/hi";
import { GiHouse, GiMeal } from "react-icons/gi";

export const OrderStatus = {
  SENT: 'text-orange-400',
  CONFIRMED: 'text-green-700',
  REJECTED: 'text-red-700',
  SERVED: 'text-gray-700',
  EXPIRED: 'text-gray-700'
}

export type SK = keyof typeof OrderStatus

export type OrderItem = {
  id: string,
  name: string,
  unitPrice: number,
  quantity: number,
  group: string,
  featureImgUrl: string
}

export type Order = {
  orderId: string,
  id: string,
  guestName: string,
  status: string,
  startTime: Date,
  invoiceId: string,
  items: OrderItem[],
  expectedTime: Date
}

type OrderManagerProps = {
  chat: Chat,
  authorizedUserId: string | null,
  displayName: string,
  activeMenu: any
}

const listOpts = ['coming', 'all']

export const OrderManager = (props: OrderManagerProps) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredName, setFilteredName] = useState('')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [showInvoices, setShowInvoices] = useState(false)
  const [activeListOpt, setActiveListOpt] = useState(listOpts[0])

  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0
  })

  const handlePaginationClick = (pageNumber: number) => {
    console.log("Pagination nav bar click to page %s", pageNumber)
    var pNum = pageNumber < 0 ? 0 : pageNumber > pagination.totalPages - 1 ? pagination.totalPages - 1 : pageNumber;
    setPagination({
      ...pagination,
      pageNumber: pNum
    })
  }

  const fetchOrders = () => {
    var fromTime = formatISODateTime(beginOfDay(new Date()))
    console.info("Fetch upcoming order after %s", fromTime)

    fetchUpcomingOrders(fromTime, activeListOpt, pagination.pageNumber, pagination.pageSize)
      .then((rsp: Response) => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setOrders(data.content)
              if (data.totalPages !== pagination.totalPages) {
                var page = {
                  pageNumber: data.number,
                  pageSize: data.size,
                  totalElements: data.totalElements,
                  totalPages: data.totalPages
                }
                setPagination(page)
              }
            })
        }
      })
  }

  const fetchLinkedInvoices = () => {
    orders.filter((o) => o.status === 'CONFIRMED')
      .map((o) => o.invoiceId)
      .forEach((invoiceId) => {
        getInvoice(invoiceId)
          .then((inv) => setInvoices([...invoices, inv]))
      })
  }

  useEffect(() => {
    fetchOrders();
    props.activeMenu()
    // eslint-disable-next-line
  }, [pagination.pageNumber]);

  useEffect(() => {
    fetchLinkedInvoices();
    // eslint-disable-next-line
  }, [orders]);

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line
  }, [activeListOpt]);


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
              setFilteredInvoices(data.content)
            })
        }
      }).finally(() => {
        setShowInvoices(true)
      })
  }

  const hideInvoices = () => {
    setFilteredName('')
    setShowInvoices(false)
  }
  const changeFilteredName = (e: ChangeEvent<HTMLInputElement>) => {
    let fN = e.target.value
    setFilteredName(fN)
    if (fN === '') {
      findTheInvoice()
      return
    }
    let fromDate = formatISODate(new Date())

    listInvoiceByGuestName(fromDate, fN, 0, DEFAULT_PAGE_SIZE)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setFilteredInvoices(data.content)
            })
        }
      })
  }

  const emptyFilteredName = () => {
    setFilteredName('')
    findTheInvoice()
  }

  const copyOrderLink = (invoice: Invoice) => {
    let url = process.env.REACT_APP_MENU_WEB_APP + '/menu/food/' + invoice.id
    navigator.clipboard.writeText(url)
    console.info("Url %s has been copied", url)
    setFilteredInvoices([])
    setShowInvoices(false)
    setFilteredName('')
  }

  const changeListOpt = () => {
    let cIdx = listOpts.findIndex(o => o === activeListOpt)
    if (cIdx === listOpts.length - 1) {
      setActiveListOpt(listOpts[0])
      return
    }
    setActiveListOpt(listOpts[cIdx + 1])
  }

  return (
    <div className="h-full pt-3">
      <div className="flex flex-row items-center w-full pb-4 px-2 space-x-3">
        <Button onClick={findTheInvoice}>Copy Link</Button>
        <div onClick={changeListOpt} className="px-2 font-mono text-sm border rounded-sm shadow-sm bg-slate-200">
          {activeListOpt.toUpperCase()}
        </div>
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
                        to={order.id + "/" + props.chat.id}
                        state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-500 overflow-hidden"
                      >
                        {order.guestName}
                      </Link>
                    </div>
                    <div className="flex flex-row text-sm space-x-3">
                      <div className="flex flex-row items-center rounded-sm">
                        <HiMail />
                        <span className="font font-mono text-gray-500 text-[12px]">{formatISOTime(new Date(order.startTime))}</span>
                      </div>
                      {order.expectedTime ? <div className="flex flex-row items-center rounded-sm">
                        <GiMeal />
                        <span className="font font-mono text-gray-500 text-[12px]">{formatISOTime(new Date(order.expectedTime))}
                        </span></div> : <></>
                      }
                      {order.invoiceId ? <div className="flex flex-row items-center rounded-sm">
                        <GiHouse />
                        <span className="font font-mono text-[12px]">{invoices.find(i => i.id === order.invoiceId)?.rooms}
                        </span></div> : <></>}
                    </div>
                  </div>
                </div>
                <div className="pl-0.2 pr-1">
                  <div className="bg-zinc-200 rounded-md py-0.5 w-24 text-center">
                    <span className={"font font-mono font-bold " + OrderStatus[order.status as SK]}>{order.status}</span>
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
              rightIcon={() => <HiX onClick={emptyFilteredName} />}
            />
          </div>
          <div className="flex flex-col space-y-6pb-4 sm:pb-6 lg:px-8 xl:pb-8">
            {filteredInvoices.map((invoice) => {
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
