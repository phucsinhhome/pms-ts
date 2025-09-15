import React, { useState, useEffect, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { formatISODate, formatISODateTime } from "../Service/Utils";
import { Chat, DEFAULT_PAGE_SIZE } from "../App";
import { listOrderByStatuses, listOrders } from "../db/order";
import { Button, Modal, TextInput } from "flowbite-react";
import { getInvoice, listInvoiceByGuestName, listStayingAndComingInvoicesAndPrepaid } from "../db/invoice";
import { Invoice } from "./InvoiceManager";
import { HiClipboardCopy, HiOutlineClock, HiX } from "react-icons/hi";
import { GiHouse, GiMeal } from "react-icons/gi";
import { listAllPGroups } from "../db/pgroup";
import { PGroup } from "./PGroupManager";
import { AppConfig } from "../db/configs";
import { activeGroupStyle } from "./Inventory";
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

const menuDisplayMappings: { [key: string]: string } = {
  food: 'FOO',
  baverage: 'BEV',
  breakfast: 'BRE',
  other: 'OTH'
}

export const OrderManager = (props: OrderManagerProps) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredName, setFilteredName] = useState('')
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [showInvoices, setShowInvoices] = useState(false)
  const [activeStatuses, setActiveStatuses] = useState(["CONFIRMED", "SENT"])

  const [pGroups, setPGroups] = useState<PGroup[]>([])
  const [activeGroup, setActiveGroup] = useState<PGroup | undefined>()

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

  useEffect(() => {

    if (pGroups.length === 0) {
      return
    }
    let pGroup = pGroups.find(pg => pg.groupId === props.configs?.orderManagement.copyLink.defaultGroup)
    if (pGroup !== undefined) {
      setActiveGroup(pGroup || undefined)
    }
    findTheInvoice()

    // eslint-disable-next-line
  }, [pGroups]);

  const pageClass = (pageNum: number) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  const fetchPGroups = () => {
    listAllPGroups()
      .then(rsp => {
        // Axios response: data is in rsp.data, status is rsp.status
        if (rsp.status === 200) {
          setPGroups(rsp.data.content)
        }
      })
      .catch((e) => {
        setPGroups([])
        console.error("Error while fetching product groups", e)
        if (e instanceof Error) {
          alert(e.message)
        }
      });
  }

  const chooseCopyOpts = () => {
    if (pGroups.length === 0) {
      fetchPGroups()
      return
    }
    findTheInvoice()
  }

  const findTheInvoice = () => {
    let fromDate = formatISODate(new Date())
    listStayingAndComingInvoicesAndPrepaid(fromDate, false, 0, 7)
      .then(rsp => {
        if (rsp.status === 200) {
          const data = rsp.data
          setFilteredInvoices(data.content)
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
        if (rsp.status === 200) {
          const data = rsp.data
          setFilteredInvoices(data.content)
          if (data.content.length <= 0) {
            console.warn("No invoice found for guest name %s", fN)
          }
        }
      })
  }

  const emptyFilteredName = () => {
    setFilteredName('')
    findTheInvoice()
  }

  const copyOrderLink = (invoice: Invoice) => {
    let resolvedMenuApp = props.configs?.orderManagement.copyLink.defaultMenuApp
    props.configs?.orderManagement.copyLink.menuAppMappings.forEach(m => {
      if (activeGroup?.name.startsWith(m.startWiths)) {
        resolvedMenuApp = m.app
        console.info("Resolved menu app %s", resolvedMenuApp)
      }
    })
    if (resolvedMenuApp === undefined) {
      console.error("No menu app found for group %s", activeGroup?.name)
      return
    }
    let url = `${process.env[resolvedMenuApp]}/menu/${activeGroup?.name}/${invoice.id}`
    navigator.clipboard.writeText(url)
    console.info("Url %s has been copied", url)
    setFilteredInvoices([])
    setShowInvoices(false)
    setFilteredName('')
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
        <Button size="xs" color="green" onClick={chooseCopyOpts}>
          <HiClipboardCopy size="1.5em" className="mr-2" /> Copy Link
        </Button>
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
                <Link
                  to={order.id + "/" + props.chat.id}
                  state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                  className="font-sans font-semibold text-green-800 hover:underline dark:text-gray-100 overflow-hidden"
                >
                  {order.guestName}
                </Link>
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
                    <span className="font font-semibold text-red-950 text-[14px]">{menuDisplayMappings[order.group]}</span>
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


      <Modal
        show={showInvoices}
        popup={true}
        onClose={hideInvoices}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="flex flex-row items-center px-0 pb-2 space-x-1 overflow-scroll">
            {
              pGroups.map((pg) => {
                return (
                  <div
                    key={pg.groupId}
                    className={activeGroupStyle(pg.groupId === activeGroup?.groupId)}
                    onClick={() => setActiveGroup(pg)}
                  >
                    {pg.displayName}
                  </div>
                )
              }
              )
            }
          </div>
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
                  className="flex flex-row items-center border rounded-md px-2 border-gray-300 bg-white dark:bg-slate-500 relative"
                  key={invoice.id}
                >
                  <div className="px-0 w-full">
                    <div className="grid grid-cols-1">
                      <div className="flex flex-row">
                        <span
                          className="font-medium text-green-800 overflow-hidden"
                        >
                          {invoice.guestName}
                        </span>
                      </div>
                      <div className="flex flex-row text-sm space-x-1">
                        <div className="flex flex-row items-center">
                          <PiCalendarCheckThin />
                          <span className="font font-mono text-gray-500 text-[10px]">{invoice.checkInDate}</span>
                        </div>
                        <div className="flex flex-row items-center">
                          <GiHouse />
                          <span className="font font-mono text-[10px]">{invoice.rooms}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row items-center rounded-xl bg-slate-300 absolute right-1 px-1 space-x-1">
                    <HiClipboardCopy />
                    <span className="font-sans text-sm text-amber-900 py-1 hover:underline"
                      onClick={() => copyOrderLink(invoice)}>{activeGroup?.displayName}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center">
          <Button size="xs" color="green" onClick={hideInvoices}>
            <IoMdArrowBack size="1.5em" className="mr-2" /> Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
}
