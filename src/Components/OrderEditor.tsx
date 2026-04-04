import React, { useState, useEffect, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { Avatar, Button, Label, Modal, TextInput } from "flowbite-react";
import { Chat, DEFAULT_PAGE_SIZE } from "../App";
import { formatISODate, formatISODateTime, formatRooms, formatVND } from "../Service/Utils";
import { confirmOrder, fetchOrder, getPotentialInvoices, rejectOrder, saveOrder, serveOrder } from "../db/order";
import { getInvoice, listInvoiceByGuestName } from "../db/invoice";
import { Order, OrderStatus, SK } from "./OrderManager";
import { Invoice } from "./InvoiceManager";
import { PGroup } from "./PGroupManager";
import { listAllPGroups } from "../db/pgroup";

type OrderParams = {
  orderId: string,
  staffId: string
}

type OrderEditorProps = {
  chat: Chat,
  activeMenu: any
}

export const OrderEditor = (props: OrderEditorProps) => {

  const [pGroups, setPGroups] = useState<PGroup[]>([])
  const [order, setOrder] = useState<Order>()

  const [showInvoices, setShowInvoices] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [potentialInvoices, setPotentialInvoices] = useState<Invoice[]>([])
  const [choosenInvoice, setChoosenInvoice] = useState<Invoice | null>()
  const [filteredName, setFilteredName] = useState('')

  const { orderId, staffId } = useParams<OrderParams>()
  const readOrder = async () => {
    try {
      if (orderId === undefined) {
        console.warn("Invalid order id")
        return
      }
      console.info("Loading the order")

      const rsp = await fetchOrder(orderId)
      if (rsp.status !== 200) {
        console.error("Cannot load the order %s", orderId)
        return
      }
      const data: Order = rsp.data
      console.info("Order %s has been loaded", data.orderId)
      setOrder(data)
      let invoiceId = data.invoiceId
      if (invoiceId !== undefined && invoiceId !== null && invoiceId !== '') {
        getInvoice(invoiceId)
          .then(rsp => {
            if (rsp.status === 200) {
              const inv: Invoice = rsp.data
              console.info("Linked invoice %s has been loaded", inv.id)
              setChoosenInvoice(inv)
            }
          })
          .catch((e) => {
            console.error("Error while fetching the linked invoice", e)
          });
      }

      // Fetch potential invoices
      getPotentialInvoices(orderId)
        .then(rsp => {
          if (rsp.status === 200) {
            setPotentialInvoices(rsp.data);
          }
        })
        .catch(err => console.warn("Failed to fetch potential invoices", err));

    } catch (e) {
      console.error("Error while fetching the order", e)
      if (e instanceof Error) {
        alert(e.message)
      }
    }
  }

  useEffect(() => {
    if (staffId !== null) {
      console.info(`Update the user to ${staffId}`)
    }
    readOrder();
    props.activeMenu()
    fetchProductGroups()

    // eslint-disable-next-line
  }, [orderId]);

  const fetchProductGroups = async () => {
    try {
      const rsp = await listAllPGroups()
      if (rsp.status !== 200) {
        console.error("Cannot load product groups")
        setPGroups([])
        return
      }
      const data: PGroup[] = rsp.data.content
      console.info("Loaded %d product groups", data.length)
      setPGroups(data)
    } catch (e) {
      console.error("Error while fetching product groups", e)
      setPGroups([])
    }
  }

  const sendToPreparation = async () => {

    if (order === undefined) {
      console.warn("Invalid order")
      return
    }
    try {
      var confirmedAt = formatISODateTime(new Date())
      var confirmedOrder = {
        ...order,
        confirmedAt: confirmedAt,
        confirmedBy: props.chat.username,
        status: 'CONFIRMED'
      }

      const rsp = await confirmOrder(confirmedOrder)
      if (rsp.status === 400) {
        alert(rsp.data.message)
      }
      if (rsp.status === 200) {
        const data: Order = rsp.data
        console.info("Send oder to preparation %s successfully", data.orderId)
        setOrder(data)
      }
    } catch (e) {
      console.error("Error while sending order to preparation", e)
      if (e instanceof Error) {
        alert(e.message)
      }
    }
  }

  const markAsServed = async () => {
    try {
      if (order === undefined) {
        return
      }
      const rsp = await serveOrder({
        ...order,
        servedAt: formatISODateTime(new Date())
      })
      if (rsp.status === 400) {
        alert(rsp.data.message)
      }
      if (rsp.status === 200) {
        const data: Order = rsp.data
        setOrder(data)
        console.info("Order %s has been served successfully", data.orderId)
      }
    } catch (e) {
      console.error("Error while marking the order as served", e)
      if (e instanceof Error) {
        alert(e.message)
      }
    }
  }

  const stopPreparation = async () => {
    try {
      if (orderId === undefined) {
        console.warn("Invalid order id")
        return
      }
      if (staffId === undefined) {
        console.warn("Invalid staff id")
        return
      }
      const rsp = await rejectOrder(orderId, staffId);
      if (rsp.status === 200) {
        const data: Order = rsp.data
        console.info("Order %s has been rejected", data.orderId)
        setOrder(data)
      }
    } catch (e) {
      console.error("Error while rejecting the order", e)
      if (e instanceof Error) {
        alert(e.message)
      }
    }
  }

  const cancelLinkInvoice = () => {
    setShowInvoices(false)
  }

  const handleInvSelection = (inv: Invoice) => {
    setChoosenInvoice(inv)
  }

  const handleUnlink = async () => {
    if (!order) return;
    try {
      const o = { ...order, invoiceId: "" };
      const rsp = await saveOrder(o);
      if (rsp.status === 200) {
        setOrder(rsp.data);
        setChoosenInvoice(null);
        console.info("Order unlinked successfully");
      }
    } catch (e) {
      console.error("Failed to unlink order", e);
    }
  };

  const confirmChangeInvoice = async () => {
    try {
      if (order === undefined || order === null) {
        console.warn("Invalid order")
        return
      }
      if (choosenInvoice === undefined || choosenInvoice === null || choosenInvoice.id === undefined) {
        console.warn("Invalid choosen invoice")
        return
      }
      if (order.invoiceId === choosenInvoice.id) {
        console.warn("You choose the same linked invoice")
        setShowInvoices(false)
        return
      }
      var o = {
        ...order,
        invoiceId: choosenInvoice.id
      }

      const rsp = await saveOrder(o);
      if (rsp.status === 200) {
        setOrder(rsp.data)
        console.info("Changed linked invoice to %s", choosenInvoice.id)
      } else {
        console.error("Failed to save order with linked invoice")
      }
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
        if (rsp.status === 200) {
          const data: Invoice[] = rsp.data.content
          console.info("Found %d invoices for guest name %s", data.length, fN)
          setInvoices(data)
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
              choosenInvoice ?
                <div className="flex flex-row items-center space-x-2">
                  <span className="font text-[9px] italic">{" linked to: "}</span>
                  <span>{choosenInvoice?.guestName}</span>
                  <span className="font text-sm font-bold">{"(" + formatRooms(choosenInvoice?.rooms) + ")"}</span>
                </div>
                : <></>
            }
          </div>
          <div className="flex flex-row items-center space-x-2">
            <span className={"font font-mono " + OrderStatus[order?.status as SK]}>{order?.status}</span>
            <span className="font font-mono text-sm text-gray-400">{order?.invoiceId}</span>
          </div>
        </div>
        <div className="flex flex-col space-y-1 pt-2 px-2">
          {
            pGroups?.filter(grp => order?.items.map(i => i.group).includes(grp.name))
              .map((grp) => <div key={grp.name}>
                <div className="font font-mono font-bold text-sm text-center ">{grp.displayName}</div>
                {order?.items.filter(it => it.group === grp.name).map((item) => {
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
                })}
              </div>)
          }

        </div>
      </div>
      <div className="flex flex-row items-center justify-between pt-3 px-2">
        <Button onClick={stopPreparation} disabled={order?.status !== 'SENT'}>Reject</Button>
        <div className="flex space-x-2">
          {order?.invoiceId ? (
            <Button color="failure" onClick={handleUnlink}>
              Unlink
            </Button>
          ) : null}
          <Button onClick={() => setShowInvoices(true)}>
            {order?.invoiceId ? "Change Invoice" : "Link Invoice"}
          </Button>
        </div>
        {
          order?.status === 'SENT' && order.invoiceId ?
            <Button onClick={sendToPreparation} >Confirm</Button>
            : <></>
        }

        {
          order?.status === 'CONFIRMED' ?
            <Button onClick={markAsServed}>Served</Button>
            : <></>
        }

      </div>


      <Modal
        show={showInvoices}
        onClose={cancelLinkInvoice}
        popup={true}
      >
        <Modal.Header>
          <div className="px-4 pt-4 pb-2 border-b">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Link Order to Invoice
            </h3>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4 pt-4">
            {potentialInvoices.length > 0 && (
              <div>
                <span className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 block">
                  Recommended (Current Guests)
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {potentialInvoices.map(inv => (
                    <div
                      key={inv.id}
                      className={choosenInvoice?.id === inv.id
                        ? "flex flex-col py-2 px-3 border-2 border-green-500 rounded-lg bg-green-50 dark:bg-green-900 cursor-pointer"
                        : "flex flex-col py-2 px-3 border border-gray-200 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 cursor-pointer"
                      }
                      onClick={() => handleInvSelection(inv)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-blue-700 dark:text-blue-400">
                          {inv.guestName}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">
                          {formatRooms(inv.rooms)}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {inv.checkInDate} - {inv.checkOutDate}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                Search Guest
              </span>
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

            {invoices.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2 mt-2">
                {invoices.map(inv => (
                  <div
                    key={inv.id}
                    className={choosenInvoice?.id === inv.id
                      ? "flex flex-col py-2 px-3 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900 cursor-pointer"
                      : "flex flex-col py-2 px-3 border border-gray-200 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 cursor-pointer"
                    }
                    onClick={() => handleInvSelection(inv)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-blue-700 dark:text-blue-400">
                        {inv.guestName}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        {formatRooms(inv.rooms)}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {inv.checkInDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-end space-x-2">
          <Button color="gray" onClick={cancelChangeInvoice}>
            Cancel
          </Button>
          <Button color="green" onClick={confirmChangeInvoice} disabled={!choosenInvoice}>
            Link Selected
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
}
