import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar, Button, Label, Modal } from "flowbite-react";
import { DEFAULT_PAGE_SIZE } from "../../App";
import { formatISODate, formatISODateTime, formatVND } from "../../Service/Utils";
import { confirmOrder, fetchOrder, rejectOrder } from "../../db/order";
import { listStayingAndComingInvoices } from "../../db/invoice";


export const Order = () => {

  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 200,
    totalPages: 20
  })
  const [order, setOrder] = useState({})
  const [message, setMessage] = useState('No item')

  const [showPotentialInvoices, setShowPotentialInvoices] = useState(false)
  const [potentialInvoices, setPotentialInvoices] = useState([])
  const [choosenGuest, setChoosenGuest] = useState({})

  const { orderId, staffId } = useParams()
  const readOrder = () => {
    console.info("Loading the order")

    fetchOrder(orderId)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setOrder(data)
            })
        }
      })
  }

  useEffect(() => {
    readOrder();

    // eslint-disable-next-line
  }, [orderId]);

  const sendToPreparation = () => {
    var confirmedAt = formatISODateTime(new Date())
    var confirmedOrder = {
      ...order,
      confirmedAt: confirmedAt,
      confirmedBy: staffId
    }

    confirmOrder(confirmedOrder)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              console.info("Send oder to preparation %s successfully", data.orderId)
              setOrder(data)
              setMessage("Confirmed successfully")
            })
        }
      })
  }

  const stopPreparation = () => {

    rejectOrder(orderId, staffId)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              console.info("Order %s has been rejected", data.orderId)
              setOrder(data)
              setMessage("Order has been rejected")
            })
        }
      })
  }

  const handlePaginationClick = (pageNumber) => {
    console.log("Pagination nav bar click to page %s", pageNumber)
    var pNum = pageNumber < 0 ? 0 : pageNumber > pagination.totalPages - 1 ? pagination.totalPages - 1 : pageNumber;
    var pSize = pagination.pageSize
    fetchInvoices(pNum, pSize)
  }

  const fetchInvoices = (page, size) => {

    var fromDate = formatISODate(new Date())
    console.log('Fetching invoices from date %s page %d size %d', fromDate, page, size)
    listStayingAndComingInvoices(fromDate, page, size)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setPotentialInvoices(data.content)
              setShowPotentialInvoices(true)
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

  const cancelLinkInvoice = () => {
    setShowPotentialInvoices(false)
  }

  const handleInvSelection = (inv) => {
    setChoosenGuest(inv)
  }

  const confirmChangeInvoice = () => {
    try {
      if (order === undefined || order === null) {
        return
      }
      if (choosenGuest === undefined || choosenGuest === null) {
        return
      }
      if (order.invoiceId === choosenGuest.id) {
        return
      }
      var o = {
        ...order,
        invoiceId: choosenGuest.id
      }
      setOrder(o)
      console.info("Changed linked invoice to %s", order.invoiceId)
    } catch (e) {
      console.error(e)
    }
    finally {
      setShowPotentialInvoices(false)
    }
  }

  const cancelChangeInvoice = () => {
    try {
      setChoosenGuest({})
    } catch (e) {
      console.error(e)
    }
    finally {
      setShowPotentialInvoices(false)
    }
  }

  const pageClass = (pageNum) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  return (
    <div className="h-full pt-3">
      <div className="flex flex-col max-h-fit overflow-hidden">
        <div className="flex flex-col space-y-1">
          <Label>{'Order Id: ' + order.orderId}</Label>
          <Label>{'Guest Name: ' + order.guestName}</Label>
          <Label>{'Invoice Id: ' + order.invoiceId}</Label>
          <Label>{'Status: ' + order.status}</Label>
        </div>
        <div className="flex flex-col space-y-1 pt-2">
          {order.items ? order.items.map((item) => {
            return (
              <div
                className="flex flex-row items-center border border-gray-300 shadow-2xl rounded-md bg-white dark:bg-slate-500 "
                key={item.id}
              >
                <div className="pl-0.5 pr-1">
                  <Avatar img={item.featureImgUrl} alt="dish image" rounded className="w-12" />
                </div>
                <div className="px-0 w-full">
                  <div className="grid grid-cols-1">
                    <div className="flex flex-row">
                      <Link
                        to={item.id}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-500 overflow-hidden"
                      >
                        {item.name}
                      </Link>
                    </div>
                    <div className="flex flex-row text-sm space-x-1">
                      <span className="font font-mono text-gray-500 text-[10px]">{item.description}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col pl-0.2 pr-2">
                  <div>
                    <span className="w-full text text-center font-mono text-red-700 font-semibold">{formatVND(item.unitPrice)}</span>
                  </div>
                  <div className="relative flex items-center w-full mb-2">
                    <button
                      type="button"
                      id="decrement-button"
                      data-input-counter-decrement="quantity-input"
                      className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg py-1 px-2 h-7 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                      disabled
                    >
                      <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      id="quantity-input"
                      data-input-counter aria-describedby="helper-text-explanation"
                      className="bg-gray-50 border-x-0 border-gray-300 h-7 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-9 py-1 pr-0 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="999"
                      required
                      value={item.quantity}
                      readOnly
                    />
                    <button
                      type="button"
                      id="increment-button"
                      data-input-counter-increment="quantity-input"
                      className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg py-1 px-2 h-7 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                      disabled
                    >
                      <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>
            )
          }) : <>{message}</>}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <Button className="px-3 py-2 mt-2 mx-3 h-9" onClick={stopPreparation} disabled={order.items === undefined || order.status !== 'SENT'}>Reject</Button>
        <Button className="px-3 py-2 mt-2 mx-3 h-9" onClick={() => fetchInvoices(0, DEFAULT_PAGE_SIZE)} disabled={order.items === undefined}>Link invoice</Button>
        <Button className="px-3 py-2 mt-2 mx-3 h-9" onClick={sendToPreparation} disabled={order.invoiceId === null || order.items === undefined || order.status !== 'SENT'}>Confirm</Button>
      </div>


      <Modal
        show={showPotentialInvoices}
        onClose={cancelLinkInvoice}
        popup={true}
      >
        <Modal.Body>
          <div className="flex flex-col">
            {potentialInvoices && potentialInvoices.length > 0 ?
              <div>
                <div><span className="font italic">Choose to link the order with an invoice</span></div>
                <div className="flex flex-col space-y-2">
                  {potentialInvoices.map(inv =>
                    <div
                      key={inv.id}
                      className={choosenGuest.id === inv.id
                        ? "flex flex-col py-1 px-2  border border-gray-100 shadow-sm rounded-md bg-amber-600 dark:bg-slate-500"
                        : "flex flex-col py-1 px-2 border border-gray-100 shadow-sm rounded-md bg-white dark:bg-slate-500"
                      }
                      onClick={() => handleInvSelection(inv)}
                    >
                      <Label
                        className="font-bold text-xs text-left text-blue-600 hover:underline overflow-hidden"
                      >
                        {inv.guestName}
                      </Label>
                      <Label
                        className="font-mono text-sm text-left text-gray-500 overflow-hidden"
                      >
                        {inv.checkInDate}
                      </Label>
                    </div>
                  )}
                </div>
                <div className="flex flex-row items-center justify-between">
                  <nav className="flex items-center justify-between pt-2" aria-label="Table navigation">
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
                </div>
              </div>
              : <div className="flex flex-wrap -mx-3 mb-6">
                <span className="text-red-800 text-center">There is no invoice! Please create invoice from Invoice Managenent first.</span>
              </div>
            }
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={confirmChangeInvoice}>Confirm</Button>
          <Button color="gray" onClick={cancelChangeInvoice}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
}
