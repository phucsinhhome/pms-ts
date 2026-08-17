import React, { useState, useEffect, ChangeEvent } from "react";
import { formatISODate, formatISODateTime, formatRooms } from "../Service/Utils";
import { Chat, DEFAULT_PAGE_SIZE } from "../App";
import { confirmOrder, getPotentialInvoices, listOrderByStatuses, listOrders, rejectOrder, saveOrder, serveOrder } from "../db/order";
import { Button, Modal, TextInput } from "flowbite-react";
import { getInvoice, listInvoiceByGuestName } from "../db/invoice";
import { Invoice } from "./InvoiceManager";
import { HiOutlineClock, HiX } from "react-icons/hi";
import { GiHouse, GiMeal } from "react-icons/gi";
import { AppConfig } from "../db/configs";
import { PiCalendarCheckThin } from "react-icons/pi";
import { IoMdArrowBack } from "react-icons/io";

export const OrderStatus = {
  SENT: 'text-orange-400',
  CONFIRMED: 'text-green-700',
  REJECTED: 'text-red-700',
  SERVED: 'text-gray-700',
  EXPIRED: 'text-gray-700'
}

const OrderStatusStyle: { [key: string]: string } = {
  SENT: "bg-orange-100 dark:bg-slate-500",
  CONFIRMED: "bg-green-100 dark:bg-slate-500",
  REJECTED: "bg-red-100 dark:bg-slate-500",
  SERVED: "bg-gray-100 dark:bg-slate-500",
  EXPIRED: "bg-white dark:bg-slate-500"
}

const filterables: string[] = ["CONFIRMED", "SENT", "SERVED"]

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
  startTime: string,
  invoiceId: string,
  items: OrderItem[],
  expectedTime: string,
  servedAt: string,
  confirmedAt?: string,
  confirmedBy?: string,
  group: string,
  rooms: string[]
}

type OrderManagerProps = {
  chat: Chat,
  authorizedUserId: string | null,
  displayName: string,
  activeMenu: any,
  configs: AppConfig | undefined,
  handleUnauthorized: any
}

export const OrderManager = (props: OrderManagerProps) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredName, setFilteredName] = useState('')
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [potentialInvoices, setPotentialInvoices] = useState<Invoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice>()
  const [selectedOrder, setSelectedOrder] = useState<Order>()
  const [showInvoices, setShowInvoices] = useState(false)
  const [activeStatuses, setActiveStatuses] = useState(["CONFIRMED", "SENT"])

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

  const fetchOrders = async () => {
    var today = new Date()
    today.setDate(today.getDate() - 1)
    today.setHours(0, 0, 0, 0)
    var fromTime = formatISODateTime(today)
    console.info(`Fetch upcoming order after ${fromTime}`)

    let ordersData = { content: [], totalPages: 0, number: 0, size: 0, totalElements: 0 }
    if (activeStatuses.length === 0) {
      const rsp = await listOrders(fromTime, pagination.pageNumber, pagination.pageSize);
      if (rsp.status === 401 || rsp.status === 403) {
        props.handleUnauthorized()
        return
      }
      ordersData = rsp.data
    }
    if (activeStatuses.length > 0) {
      const rsp = await listOrderByStatuses(fromTime, activeStatuses, pagination.pageNumber, pagination.pageSize);
      if (rsp.status === 401 || rsp.status === 403) {
        props.handleUnauthorized()
        return
      }
      ordersData = rsp.data
    }

    var orders: Order[] = ordersData.content || []
    if (orders.length <= 0) {
      setOrders([])
      return
    }
    Promise.all(orders.map(async (order: Order): Promise<Order> => {
      if (!order.orderId || !order.invoiceId) {
        return transf(order)
      }
      const data = await getInvoice(order.invoiceId);
      return {
        ...order,
        rooms: data.data.rooms
      };
    }))
      .then(ords => {
        var sortedOrders: Order[] = []
        filterables
          .map(s => ords.filter(o => o.status === s))
          .forEach((ors: Order[]) => sortedOrders.push(...ors))
        setOrders(sortedOrders)
        if (ordersData.totalPages !== pagination.totalPages) {
          var page = {
            pageNumber: ordersData.number,
            pageSize: ordersData.size,
            totalElements: ordersData.totalElements,
            totalPages: ordersData.totalPages
          }
          setPagination(page)
        }
      })

  }

  const transf = async (order: Order) => {
    return {
      ...order,
      rooms: []
    }
  }

  useEffect(() => {
    fetchOrders();
    props.activeMenu()
    // eslint-disable-next-line
  }, [pagination.pageNumber]);

  useEffect(() => {
    fetchOrders()
    // eslint-disable-next-line
  }, [activeStatuses]);


  const pageClass = (pageNum: number) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  const selectOrder = (order: Order) => {
    setSelectedOrder(order)
    setSelectedInvoice(undefined)
    setFilteredName('')
    setFilteredInvoices([])
    if (order.orderId) {
      getPotentialInvoices(order.orderId).then(rsp => {
        if (rsp.status === 200) setPotentialInvoices(rsp.data)
      }).catch(e => console.warn("Failed to fetch potential invoices", e))
    }
  }

  const updateOrder = async (order: Order, action: () => Promise<any>) => {
    try {
      const rsp = await action()
      if (rsp.status === 400) alert(rsp.data.message)
      if (rsp.status === 200) {
        setSelectedOrder(rsp.data)
        await fetchOrders()
      }
    } catch (e) {
      console.error("Failed to update order", e)
    }
  }

  const rejectSelected = () => selectedOrder && updateOrder(selectedOrder,
    () => rejectOrder(selectedOrder.orderId, props.chat.username))

  const confirmSelected = () => selectedOrder && updateOrder({
    ...selectedOrder,
    confirmedAt: formatISODateTime(new Date()), confirmedBy: props.chat.username, status: 'CONFIRMED'
  }, () => confirmOrder({
    ...selectedOrder,
    confirmedAt: formatISODateTime(new Date()), confirmedBy: props.chat.username, status: 'CONFIRMED'
  }))

  const serveSelected = () => selectedOrder && updateOrder({
    ...selectedOrder,
    servedAt: formatISODateTime(new Date())
  }, () => serveOrder({ ...selectedOrder, servedAt: formatISODateTime(new Date()) }))

  const openInvoiceModal = () => {
    if (!selectedOrder) return
    setFilteredName('')
    setFilteredInvoices([])
    setSelectedInvoice(undefined)
    setShowInvoices(true)
  }

  const changeFilteredName = (e: ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFilteredName(name)
    if (!name) { setFilteredInvoices([]); return }
    listInvoiceByGuestName(formatISODate(new Date()), name, 0, DEFAULT_PAGE_SIZE)
      .then(rsp => { if (rsp.status === 200) setFilteredInvoices(rsp.data.content) })
  }

  const confirmChangeInvoice = async () => {
    if (!selectedOrder || !selectedInvoice) return
    if (selectedOrder.invoiceId === selectedInvoice.id) { setShowInvoices(false); return }
    await updateOrder({ ...selectedOrder, invoiceId: selectedInvoice.id },
      () => saveOrder({ ...selectedOrder, invoiceId: selectedInvoice.id }))
    setShowInvoices(false)
  }

  const unlinkSelected = () => selectedOrder && updateOrder({ ...selectedOrder, invoiceId: '' },
    () => saveOrder({ ...selectedOrder, invoiceId: '' }))

  const hideInvoices = () => {
    setFilteredName('')
    setFilteredInvoices([])
    setShowInvoices(false)
  }

  const changeListOpt = (sts: string) => {
    let aL = [...activeStatuses]
    let cIdx = activeStatuses.findIndex(o => o === sts)
    if (cIdx >= 0) {
      aL.splice(cIdx, 1)
      setActiveStatuses(aL)
    } else {
      setActiveStatuses([...aL, sts])
    }
  }

  const timeOrDate = (dateString: string) => {
    let today = formatISODate(new Date())

    let date = new Date(dateString + 'Z')
    let [dates, months, hours, minutes] = [date.getDate(), date.getMonth() + 1, date.getHours(), date.getMinutes()]

    return dateString.startsWith(today) ?
      `${hours}:${minutes}`
      : `${dates}.${months} ${hours}:${minutes}`
  }

  const orderStyle = (sts: string) => {
    return OrderStatusStyle[sts]
  }

  return (
    <div className="h-full pt-3 relative">
      <div className="flex flex-row items-center w-full pb-4 px-1 space-x-3">
        <div className="flex flex-row space-x-1">
          {
            filterables.map(sts => <div onClick={() => changeListOpt(sts)}
              className={activeStatuses.includes(sts) ?
                "px-2 font-mono text-[12px] border rounded-lg bg-slate-400 cursor-pointer" :
                "px-2 font-mono text-[12px] border rounded-lg bg-slate-200 cursor-pointer"
              }>
              {sts}
            </div>)
          }
        </div>
      </div>
      <div className="flex flex-col px-2 overflow-hidden space-y-1.5">
        {orders?.map((order) => {
          return (
            <div
              className={'flex flex-col w-full border border-gray-300 shadow-sm rounded-md px-2 ' + orderStyle(order.status)}
              key={order.orderId}
            >
              <div className="flex flex-row w-full relative">
                <button
                  type="button"
                  onClick={() => selectOrder(order)}
                  className={(selectedOrder?.orderId === order.orderId ? "underline " : "") + "font-sans font-semibold text-green-800 hover:underline dark:text-gray-100 overflow-hidden text-left"}
                >
                  {order.guestName}
                </button>
                {order.invoiceId ? <div className="flex flex-row items-center rounded-sm pl-2">
                  <GiHouse />
                  <span className="font font-mono text-[12px]">{order.rooms}
                  </span></div> : <></>}
                <div className="flex flex-row items-center rounded-sm absolute right-0 pt-0.5 space-x-2">
                  {order.group === 'food' ? <div className="flex flex-row items-center">
                    <GiMeal />
                    <span className="font font-semibold text-gray-700 text-[14px]">{timeOrDate(order.expectedTime)}
                    </span></div> : <></>
                  }
                  <div className="flex flex-row items-center w-14">
                    <HiOutlineClock />
                    <span className="font font-semibold text-red-950 text-[14px]">{order.group}</span>
                  </div>
                </div>
              </div>
              <hr className="w-full divide-black" />
              <div className="flex flex-col space-y-1">
                {order.items.map((item) => {
                  return (
                    <div
                      className="flex flex-row items-center pl-4 pr-2 dark:bg-slate-500 "
                      key={item.id}
                    >
                      <span className="font font-semibold text-[12px] text-gray-700 dark:text-white-500 overflow-hidden">
                        {item.quantity + ' x ' + item.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <div className="absolute bottom-12 left-0 right-0 flex items-center justify-between px-2 py-2 bg-white dark:bg-slate-800 border-t">
        <span className="font-mono text-xs truncate">{selectedOrder ? `${selectedOrder.guestName} (${selectedOrder.status})` : "Select an order"}</span>
        <div className="flex space-x-2">
          <Button size="xs" onClick={rejectSelected} disabled={!selectedOrder || selectedOrder.status !== 'SENT'}>Reject</Button>
          <Button size="xs" onClick={openInvoiceModal} disabled={!selectedOrder}>{selectedOrder?.invoiceId ? "Change Invoice" : "Link Invoice"}</Button>
          {selectedOrder?.invoiceId ? <Button size="xs" color="failure" onClick={unlinkSelected}>Unlink</Button> : null}
          {selectedOrder?.status === 'SENT' && selectedOrder.invoiceId ? <Button size="xs" color="success" onClick={confirmSelected}>Confirm</Button> : null}
          {selectedOrder?.status === 'CONFIRMED' ? <Button size="xs" color="success" onClick={serveSelected}>Served</Button> : null}
        </div>
      </div>
      <nav className="flex items-center justify-between mt-2 px-2 absolute bottom-1" aria-label="Table navigation">
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


      <Modal show={showInvoices} popup={true} onClose={hideInvoices}>
        <Modal.Header>Link Order to Invoice</Modal.Header>
        <Modal.Body>
          <div className="space-y-2">
            {potentialInvoices.map(invoice => <button type="button" key={invoice.id}
              className={(selectedInvoice?.id === invoice.id ? "border-2 border-green-500 bg-green-50 " : "border border-gray-300 ") + "w-full text-left rounded-lg px-3 py-2"}
              onClick={() => setSelectedInvoice(invoice)}>
              <div className="flex justify-between font-bold text-sm"><span>{invoice.guestName}</span><span>{formatRooms(invoice.rooms)}</span></div>
              <span className="text-xs text-gray-500">{invoice.checkInDate} - {invoice.checkOutDate}</span>
            </button>)}
            <TextInput id="filteredName" placeholder="Enter guest name to search" value={filteredName}
              onChange={changeFilteredName} rightIcon={() => <HiX onClick={() => { setFilteredName(''); setFilteredInvoices([]) }} />} />
            {filteredInvoices.map(invoice => <button type="button" key={invoice.id}
              className={(selectedInvoice?.id === invoice.id ? "border-2 border-blue-500 bg-blue-50 " : "border border-gray-300 ") + "w-full text-left rounded-lg px-3 py-2"}
              onClick={() => setSelectedInvoice(invoice)}>
              <div className="flex justify-between font-bold text-sm"><span>{invoice.guestName}</span><span>{formatRooms(invoice.rooms)}</span></div>
              <span className="text-xs text-gray-500">{invoice.checkInDate}</span>
            </button>)}
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-end space-x-2">
          <Button color="gray" onClick={hideInvoices}>Cancel</Button>
          <Button color="green" onClick={confirmChangeInvoice} disabled={!selectedInvoice}>Link Selected</Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
}
