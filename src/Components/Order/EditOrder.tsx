import React, { useState, useEffect, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { Avatar, Button, Label, Modal, TextInput } from "flowbite-react";
import { DEFAULT_PAGE_SIZE } from "../../App";
import { formatISODate, formatISODateTime, formatRooms, formatVND } from "../../Service/Utils";
import { confirmOrder, fetchOrder, rejectOrder } from "../../db/order";
import { getInvoice, listInvoiceByGuestName } from "../../db/invoice";
import { Order, OrderStatus } from "./OrderManager";
import { Invoice } from "../Invoice/InvoiceManager";


export const EditOrder = () => {

  const [order, setOrder] = useState<Order>()
  const [message, setMessage] = useState('No item')

  const [showInvoices, setShowInvoices] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [choosenInvoice, setChoosenInvoice] = useState<Invoice>()
  const [filteredName, setFilteredName] = useState('')

  const { orderId, staffId } = useParams()
  const readOrder = () => {
    console.info("Loading the order")

    fetchOrder(orderId)
      .then((rsp: Response) => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setOrder(data)
              let invoiceId = data.invoiceId
              if (invoiceId !== undefined && invoiceId !== null && invoiceId !== '') {
                getInvoice(invoiceId)
                  .then(inv => {
                    console.info('Set the linked invoice')
                    setChoosenInvoice(inv)
                  })
              }
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
      .then((rsp: Response) => {
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
      .then((rsp: Response) => {
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

  const cancelLinkInvoice = () => {
    setShowInvoices(false)
  }

  const handleInvSelection = (inv: Invoice) => {
    setChoosenInvoice(inv)
  }

  const confirmChangeInvoice = () => {
    try {
      if (order === undefined || order === null) {
        return
      }
      if (choosenInvoice === undefined || choosenInvoice === null) {
        return
      }
      if (order.invoiceId === choosenInvoice.id) {
        return
      }
      var o = {
        ...order,
        invoiceId: choosenInvoice.id
      }
      setOrder(o)
      console.info("Changed linked invoice to %s", order.invoiceId)
    } catch (e) {
      console.error(e)
    }
    finally {
      setShowInvoices(false)
    }
  }

  const cancelChangeInvoice = () => {
    try {
      setChoosenInvoice(undefined)
    } catch (e) {
      console.error(e)
    }
    finally {
      setShowInvoices(false)
    }
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

  return (
    <div className="h-full pt-3">
      <div className="flex flex-col max-h-fit overflow-hidden">
        <div className="flex flex-col space-y-1 px-2">
          <span className="font font-mono text-[9px] text-gray-400">{order?.orderId}</span>
          <div className="flex flex-row items-center space-x-2">
            <span className="font font-bold">{order?.guestName ? order.guestName.toUpperCase() : ""}</span>
            {
              choosenInvoice !== undefined ?
                <div className="flex flex-row items-center space-x-2">
                  <span className="font text-[9px] italic">{" linked to: "}</span>
                  <span>{choosenInvoice.guestName}</span>
                  <span className="font text-sm font-bold">{"(" + formatRooms(choosenInvoice.rooms) + ")"}</span>
                </div>
                : <></>
            }
          </div>
          <div className="flex flex-row items-center space-x-2">
            <span className={"font font-mono " + order?.status}>{order?.status}</span>
            <span className="font font-mono text-sm text-gray-400">{order?.invoiceId}</span>
          </div>
        </div>
        <div className="flex flex-col space-y-1 pt-2 px-2">
          {order?.items ? order.items.map((item) => {
            return (
              <div
                className="flex flex-row items-center border px-1 py-1 border-gray-300 shadow-2xl rounded-md bg-white dark:bg-slate-500 "
                key={item.id}
              >
                <div>
                  <Avatar img={item.featureImgUrl} alt="" rounded className="w-12" />
                </div>
                <div className="flex flex-row px-1 w-full">
                  <span
                    className="font-medium text-blue-600 dark:text-blue-500 overflow-hidden"
                  >
                    {item.quantity + 'x ' + item.name}
                  </span>
                </div>
                <div>
                  <span className="w-full text text-center font-mono text-red-700 font-semibold">{formatVND(item.unitPrice)}</span>
                </div>
              </div>
            )
          }) : <>{message}</>}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <Button className="px-3 py-2 mt-2 mx-3 h-9" onClick={stopPreparation} disabled={order?.items === undefined || order?.status !== OrderStatus.SENT}>Reject</Button>
        <Button className="px-3 py-2 mt-2 mx-3 h-9" onClick={() => setShowInvoices(true)} disabled={order?.items === undefined}>Link invoice</Button>
        <Button className="px-3 py-2 mt-2 mx-3 h-9" onClick={sendToPreparation} disabled={order?.invoiceId === null || order?.items === undefined || order?.status !== OrderStatus.SENT}>Confirm</Button>
      </div>


      <Modal
        show={showInvoices}
        onClose={cancelLinkInvoice}
        popup={true}
      >
        <Modal.Header></Modal.Header>
        <Modal.Body>
          <div className="pb-2 px-2">
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
          <div className="flex flex-col">
            {invoices && invoices.length > 0 ?
              <div>
                <div><span className="font italic">Choose to link the order with an invoice</span></div>
                <div className="flex flex-col space-y-2">
                  {invoices.map(inv =>
                    <div
                      key={inv.id}
                      className={choosenInvoice?.id === inv.id
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
              </div>
              : <div className="flex flex-wrap -mx-3 mb-6">
                <span className="text-red-800 text-center">...</span>
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
