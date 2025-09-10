import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getInvoice, updateInvoice } from "../db/invoice";
import { Table, TextInput, Label, Datepicker, Modal, Button } from 'flowbite-react';
import { HiOutlineCash, HiOutlineClipboardCopy, HiSave, HiUserCircle, HiX } from "react-icons/hi";
import { classifyServiceByItemName } from "../db/classification";
import { addDays, formatISODate, formatMoneyAmount, formatShortDate, formatVND } from "../Service/Utils";
import { Chat, DEFAULT_PAGE_SIZE } from "../App";
import { getUsers as issuers } from "../db/users";
import Moment from "react-moment";
import { listLatestReservations } from "../db/reservation";
import html2canvas from "html2canvas";
import { Invoice, InvoiceItem, Issuer } from "./InvoiceManager";
import { paymentMethods, rooms } from "../db/staticdata";
import { Product } from "./Inventory";
import { Reservation, ResRoom } from "./ReservationManager";
import { listAllProductItems } from "../db/inventory";
import { FaEye } from "react-icons/fa6";
import { IoMdArrowBack, IoMdRemoveCircle } from "react-icons/io";
import { CiEdit } from "react-icons/ci";
import { MdAssignmentAdd } from "react-icons/md";


const paymentIcons = [
  {
    id: 'cash',
    src: <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" > <path fillRule="evenodd" d="M7 6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2v-4a3 3 0 0 0-3-3H7V6Z" clipRule="evenodd" /> <path fillRule="evenodd" d="M2 11a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7Zm7.5 1a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" clipRule="evenodd" /> <path d="M10.5 14.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" /></svg>,
  }, {
    id: 'creditCard',
    src: <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" ><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z" /></svg >,
  }, {
    id: 'momo',
    src: <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z" /></svg>,
  }, {
    id: 'paypal',
    src: <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z" /></svg>,
  }, {
    id: 'bankTransfer',
    src: <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M6 14h2m3 0h5M3 7v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1Z" /></svg>
  }
]

const roomIcons = [
  {
    id: 'r1',
    src: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
  }, {
    id: 'r2',
    src: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
  }, {
    id: 'r3',
    src: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
  }, {
    id: 'r4',
    src: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
  }, {
    id: 'r5',
    src: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
  }, {
    id: 'r6',
    src: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" /></svg>
  }
]

const userIcons = [
  {
    id: 'minhtran',
    src: <HiUserCircle />
  }, {
    id: 'khatran',
    src: <HiUserCircle />
  }
]

export type PaymentMethod = {
  id: string,
  name: string,
  feeRate: number,
  template: string,
  srcLargeImg: string,
  paymentInfo: string,
  defaultIssuerId: string
}

type EditingInvoiceItem = {
  origin: InvoiceItem,
  formattedUnitPrice: string
}

const defaultEmptyItem = {
  origin: {
    id: "",
    itemName: "",
    unitPrice: 0,
    quantity: 0,
    amount: 0,
    service: ""
  },
  formattedUnitPrice: ''
}


export const internalRooms = (rooms: ResRoom[]) => {
  return rooms.map(r => r.internalRoomName)
}

export const Configs = {
  reservation: {
    fetchDays: 30
  },
  invoice: {
    initialInvoice: {
      guestName: 'Guest Name'
    },
    fetchedReservation: {
      backwardDays: -3,
      max: 100
    },
    editInvoice: {
      bucket: 'invoices'
    }
  }
}

const defaultEmptyInvoice = {
  id: "new",
  guestName: "Guest Name",
  issuer: '',
  issuerId: '',
  subTotal: 0,
  checkInDate: formatISODate(new Date()),
  checkOutDate: formatISODate(new Date()),
  prepaied: false,
  paymentMethod: paymentMethods[0].id,
  reservationCode: '',
  items: [],
  creatorId: '',
  rooms: [],
  sheetName: '',
  signed: false,
  country: '',
  createdBy: '',
}

type InvoiceProps = {
  chat: Chat,
  authorizedUserId: string | null,
  displayName: string,
  activeMenu: any
}

export const InvoiceEditor = (props: InvoiceProps) => {
  const [invoice, setInvoice] = useState<Invoice>(defaultEmptyInvoice)

  const { invoiceId } = useParams()

  const [openGuestNameModal, setOpenGuestNameModal] = useState(false)
  const [editingGuestName, setEditingGuestName] = useState('')
  const guestNameTextInput = useRef(null)

  const [openEditDateModal, setOpenEditDateModal] = useState(false)
  const [editingDate, setEditingDate] = useState<{ dateField: keyof Invoice, value: Date }>()

  const [openDelItemModal, setOpenDelItemModal] = useState(false)
  const [deletingItem, setDeletingItem] = useState<InvoiceItem>()

  const [openUsersModal, setOpenUsersModal] = useState(false)
  const [selectedIssuer, setSelectedIssuer] = useState<Issuer>(issuers[0])

  const [openPaymentModal, setOpenPaymentModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(paymentMethods[0])


  const [products, setProducts] = useState<Product[]>([])
  const [openEditingItemModal, setOpenEditingItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<EditingInvoiceItem>(defaultEmptyItem)
  const [lookupItems, setLookupItems] = useState<Product[]>([])

  const [openViewInvModal, setOpenViewInvModal] = useState(false)

  const [openChooseResModal, setOpenChooseResModal] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([])
  const [resFilteredText, setResFilteredText] = useState('')
  const filteredResText = useRef(null)

  const [openRoomModal, setOpenRoomModal] = useState(false)
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])

  const [dirty, setDirty] = useState(false)
  const [loc, setLoc] = useState({ pageNumber: 0, pageSize: DEFAULT_PAGE_SIZE })

  const location = useLocation()

  const fetchInvoice = async (invoiceId: string) => {
    if (invoiceId === "new") {
      try {
        fetchReservations()
          .then(rsp => {
            if (rsp.status === 200) {
              setReservations(rsp.data.content)
              setFilteredReservations(rsp.data.content)
              setResFilteredText('')
              setOpenChooseResModal(true)
            } else {
              setReservations([])
              setFilteredReservations([])
              setResFilteredText('')
              setOpenChooseResModal(true)
            }
          })
          .catch(() => {
            setReservations([])
            setFilteredReservations([])
            setResFilteredText('')
            setOpenChooseResModal(true)
          })
      } catch (e) {
        console.error("Error while fetching reservations", e);
        if (e instanceof Error) {
          alert(e.message);
        }
      }
      return
    }
    try {
      const rsp = await getInvoice(invoiceId)
      if (rsp.status !== 200) {
        console.error("Failed to fetch invoice %s", invoiceId)
        return
      }
      const data: Invoice = rsp.data
      if (data.paymentMethod !== null && data.paymentMethod !== undefined && data.paymentMethod !== "") {
        const pM = paymentMethods.find(m => m.id === data.paymentMethod)
        setSelectedPaymentMethod(pM || paymentMethods[0])
      }
      if (data.issuerId !== null && data.issuerId !== undefined && data.issuerId !== "") {
        const issuer = issuers.find(usr => usr.id === data.issuerId)
        setSelectedIssuer(issuer || issuers[0])
      }
      setInvoice(data)
    } catch (e) {
      console.error("Error while fetching invoice", e);
      if (e instanceof Error) {
        alert(e.message);
      }
    }
  }


  useEffect(() => {
    if (location === null || location.state === null) {
      return
    }
    var newLocation = {
      pageNumber: location.state.pageNumber,
      pageSize: location.state.pageSize
    }
    setLoc(newLocation)
  }, [location])


  useEffect(() => {
    console.info("Editing invoice %s", invoiceId)
    props.activeMenu()
    if (invoiceId === undefined) {
      console.warn("Invalid invoice id. It should be value of 'new' or a certain ID value")
      return
    }
    fetchInvoice(invoiceId)

    if (products.length <= 0) {
      console.info("Fetch the products")
      listAllProductItems()
        .then(rsp => {
          if (rsp.status === 200) {
            let data = rsp.data.content
            console.info("Fetched %d products", data.length)
            setProducts(data)
          }
        }).catch((e) => {
          console.error("Error while fetching products", e)
          if (e instanceof Error) {
            alert(e.message)
          }
        });
    }
    
    // eslint-disable-next-line
  }, [invoiceId, products.length, props])


  const handleSaveInvoice = async () => {
    console.info("Prepare to save invoice")
    if (invoice === undefined) {
      return
    }
    if (invoice.guestName === null
      || invoice.guestName === undefined
      || invoice.guestName === ""
      || invoice.guestName === Configs.invoice.initialInvoice.guestName) {
      console.warn("Invalid guest name")
      editGuestName()
      return
    }

    console.log(invoice)

    var inv = {
      ...invoice,
      creatorId: null,
      createdBy: props.chat.username,
    }

    if (invoice.id === "new") {
      var newId = String(Date.now())
      inv = {
        ...inv,
        id: newId
      }
      console.info("Generated invoice id %s", newId)
    }

    const res = await updateInvoice(inv);
    if (res.status !== 200) {
      console.error("Failed to save invoice %s", invoiceId);
      return
    }
    console.info("Invoice %s has been saved successfully", invoiceId);
    setInvoice(inv);
    setDirty(false);
  }

  const createOrUpdateItem = () => {
    try {
      if (invoiceId === undefined || invoice === undefined) {
        console.warn("Invalid invoice")
        return
      }
      if (editingItem === null || editingItem === undefined) {
        console.warn("Invalid item")
        return
      }
      let item = {
        id: editingItem.origin.id,
        itemName: editingItem.origin.itemName,
        service: editingItem.origin.service,
        unitPrice: editingItem.origin.unitPrice,
        quantity: editingItem.origin.quantity,
        amount: editingItem.origin.amount
      }
      let items = []
      if (item.id === null || item.id === "") {
        let newItemId = invoiceId + (Date.now() % 10000000)
        console.log("Added an item into invoice. Id [%s] was generated", newItemId)
        items = [
          ...invoice.items,
          {
            ...item,
            id: newItemId
          }
        ]
      } else {
        console.log("Update item [%s] ", item.id)
        items = invoice.items.map((i) => i.id === item.id ? item : i)
      }

      let ta = items.map(({ amount }) => amount).reduce((a1, a2) => a1 + a2, 0)
      const inv = {
        ...invoice,
        items: items,
        subTotal: ta
      }
      setInvoice(inv)
      setOpenEditingItemModal(false)

    } catch (e) {
      console.error(e)
    }
  }

  //============ ITEM DELETION ====================//
  const askForDelItemConfirmation = (item: InvoiceItem) => {

    setDeletingItem(item);
    setOpenDelItemModal(true)
  }

  const cancelDelItem = () => {
    setOpenDelItemModal(false)
    setDeletingItem(undefined)
  }

  const confirmDelItem = () => {
    try {
      if (invoice === undefined || deletingItem === undefined || deletingItem === null) {
        return;
      }
      console.warn("Delete item %s...", deletingItem.id)

      let item = deletingItem
      console.info("Item %s is deleted", item.id)
      const nItems = invoice.items.filter((it) => it.id !== item.id)
      let ta = nItems.map(({ amount }) => amount).reduce((a1, a2) => a1 + a2, 0)
      let inv = {
        ...invoice,
        items: nItems,
        subTotal: ta
      }

      setInvoice(inv)
    } catch (e) {
      console.error(e)
    } finally {
      setDirty(true)
      setOpenDelItemModal(false)
      setDeletingItem(undefined)
    }

  }
  //============ GUEST NAME ====================//
  const editGuestName = () => {
    if (invoice === undefined) {
      console.warn("Invalid invoice")
      return
    }
    setEditingGuestName(invoice.guestName === defaultEmptyInvoice.guestName ? '' : invoice.guestName)
    setOpenGuestNameModal(true)
  }

  const changeGuestName = (e: React.ChangeEvent<HTMLInputElement>) => {
    let nGN = e.target.value
    if (nGN === '') {
      console.warn("Invalid guest name")
      return
    }
    setEditingGuestName(nGN)
    setOpenGuestNameModal(true)
  }

  const cancelEditGuestName = () => {
    setOpenGuestNameModal(false)
  }

  const confirmEditGuestName = () => {
    if (invoice === undefined) {
      console.warn("Invalid invoice")
      return
    }
    let nInv = {
      ...invoice,
      guestName: editingGuestName
    }
    setInvoice(nInv)
    setOpenGuestNameModal(false)
    setDirty(true)
  }

  const editDate = (dateFieldName: keyof Invoice) => {
    if (invoice === undefined) {
      console.warn("Invalid invoice")
      return
    }
    // let dId: keyof Invoice = dateFieldName
    console.info("ID: %s", dateFieldName)
    let eD = {
      dateField: dateFieldName,
      value: new Date(invoice[dateFieldName] as string)
    }
    console.log(eD)
    setEditingDate(eD)
    setOpenEditDateModal(true)
  }

  const changeEditingDate = (date: Date) => {
    if (editingDate === undefined) {
      console.warn("Invalid editing date")
      return
    }
    if (invoice === undefined) {
      console.warn("Invalid invoice")
      return
    }
    console.info("Selected date")
    let now = new Date()
    // Note: set the current time ( >= 07:00) to convert to ISO date does not change the date
    let selectedDate = new Date(date.setHours(now.getHours(), 0, 0))
    console.log(selectedDate)
    const nInv = {
      ...invoice,
      [editingDate.dateField]: formatISODate(selectedDate)
    }
    setInvoice(nInv)

    setEditingDate(undefined)
    setOpenEditDateModal(false)
    setDirty(true)
  }


  const cancelEditDate = () => {
    setEditingDate(undefined)
    setOpenEditDateModal(false)
  }

  //============ ISSUER CHANGE ====================//
  const selectIssuer = () => {
    setOpenUsersModal(true)
  }
  const cancelSelectIssuer = () => {
    setOpenUsersModal(false)
  }
  const changeIssuer = (user: Issuer) => {
    try {

      if (invoice === undefined) {
        console.warn("Invalid invoice")
        return
      }
      console.warn("Change the issuer to {}...", user.id)
      setSelectedIssuer(user)
      let nInv = {
        ...invoice,
        issuerId: user.id,
        issuer: user.displayName
      }
      setInvoice(nInv)
    } catch (e) {
      console.error(e)
    } finally {
      setOpenUsersModal(false)
      setDirty(true)
    }
  }

  //============ PAYMENT METHOD CHANGE ====================//
  const selectPaymentMethod = () => {
    setOpenPaymentModal(true)
  }
  const cancelSelectPaymentMethod = () => {
    setOpenPaymentModal(false)
  }

  const changePaymentMethod = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {

    try {
      let is = e.currentTarget
      let pM = paymentMethods.find((p) => p.id === is.id)
      if (pM === undefined) {
        console.warn("Cannot find payment method with id %s", is.id)
        return
      }
      let issuer = issuers.find(iss => iss.id === pM.defaultIssuerId)
      if (issuer === undefined) {
        console.warn("Cannot find the issuer for payment %s", pM.defaultIssuerId)
        return
      }
      setSelectedPaymentMethod(pM)
      setSelectedIssuer(issuer)

      let nInv = {
        ...invoice,
        paymentMethod: pM.id,
        issuerId: issuer.id,
        issuer: issuer.displayName
      }
      setInvoice(nInv)
    } catch (e) {
      console.error(e)
    } finally {
      setOpenPaymentModal(false)
      setDirty(true)
    }
  }

  //============ PREPAIED CHANGE ====================//
  const changePrepaied = () => {
    try {
      let nInv = {
        ...invoice,
        prepaied: !invoice.prepaied
      }
      setInvoice(nInv)
    } catch (e) {
      console.error(e)
    } finally {
      setDirty(true)
    }
  }

  //================= EDIT ITEM ===================//
  const editItem = (item: InvoiceItem) => {
    let uP = formatMoneyAmount(String(item.unitPrice))
    let eI = {
      origin: item,
      formattedUnitPrice: uP.formattedAmount
    }
    setEditingItem(eI)
    setOpenEditingItemModal(true)
  }

  const cancelEditingItem = () => {
    setEditingItem(defaultEmptyItem)
    setOpenEditingItemModal(false)
  }

  //================= ITEM NAME ===================//
  const emptyItemName = () => {
    setEditingItem({
      ...editingItem,
      origin: {
        ...editingItem.origin,
        itemName: '',
        service: ''
      }
    })
  }
  const changeItemName = (e: React.ChangeEvent<HTMLInputElement>) => {
    let iName = e.target.value
    try {
      let eI = {
        ...editingItem,
        origin: {
          ...editingItem.origin,
          itemName: iName
        }
      }
      setEditingItem(eI)
      let fProducts = products.filter(p => p.name.toLowerCase().includes(iName.toLowerCase()))
      setLookupItems(fProducts)
    } catch (e) {
      console.error(e)
    } finally {

      setDirty(true)
    }
  }

  const blurItemName = async () => {
    let nItemName = editingItem.origin.itemName
    if (nItemName === null || nItemName === undefined || nItemName === "") {
      return Promise.resolve(false);
    }
    console.log("Classify the service by service name [%s]", nItemName)
    let rsp = await classifyServiceByItemName(nItemName);
    if (rsp.status !== 200) {
      console.error("Failed to classify service by item name %s", nItemName)
      return Promise.resolve(false);
    }
    let data = rsp.data
    console.log("The service was classified as %s", data.service)
    let eI = {
      ...editingItem,
      origin: {
        ...editingItem.origin,
        service: data.service
      }
    }
    setEditingItem(eI)
    setDirty(true)
    return Promise.resolve(true);
  }

  const confirmSelectItem = (product: Product) => {
    try {
      let uP = formatMoneyAmount(String(product.unitPrice))
      let eI = {
        origin: {
          id: '',
          itemName: product.name,
          quantity: 1,
          amount: product.unitPrice,
          unitPrice: product.unitPrice,
          service: ''
        },
        formattedUnitPrice: uP.formattedAmount,
      }
      setLookupItems([])
      setEditingItem(eI)

    } catch (e) {
      console.error(e)
    } finally {
      setDirty(true)
    }
  }


  //================= UNIT PRICE ===================//
  const changeUnitPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value
    let uP = formatMoneyAmount(v)
    let eI = {
      ...editingItem,
      origin: {
        ...editingItem.origin,
        unitPrice: uP.amount,
        amount: uP.amount * editingItem.origin.quantity
      },
      formattedUnitPrice: uP.formattedAmount
    }
    setEditingItem(eI)
    setDirty(true)
  }

  //================= QUANTITY ===================//
  const changeQuantity = (delta: number) => {
    let nQ = editingItem.origin.quantity + delta
    let eI = {
      ...editingItem,
      origin: {
        ...editingItem.origin,
        quantity: nQ,
        amount: editingItem.origin.unitPrice * nQ
      }
    }
    setEditingItem(eI)
    setDirty(true)
  }

  //================= VIEW INVOICE ===================//
  const showViewInv = () => {
    if (dirty) {
      handleSaveInvoice()
    }
    setOpenViewInvModal(true)
  }
  const closeViewInv = () => {
    setSharedInvData(null)
    setOpenViewInvModal(false)
  }

  //================ ADD INVOICE ==========================//
  const cancelChooseRes = () => {
    confirmNoRes()
  }

  const confirmSelectRes = (res: Reservation) => {
    try {
      let invId = props.chat.id + (Date.now() % 10000000)
      let inv = {
        id: props.chat.id + new Date().getTime(),
        guestName: res.guestName,
        issuer: props.displayName,
        issuerId: props.chat.username,
        checkInDate: formatISODate(new Date(res.checkInDate)),
        checkOutDate: formatISODate(new Date(res.checkOutDate)),
        prepaied: false,
        paymentMethod: '',
        paymentPhotos: [],
        reservationCode: res.code,
        rooms: internalRooms(res.rooms),
        creatorId: null,
        createdBy: props.chat.username,
        sheetName: '',
        signed: false,
        country: '',
        items: res.rooms.map(i => ({
          id: invId + (Date.now() % 10000000),
          itemName: i.roomName,
          unitPrice: i.totalPrice,
          quantity: 1,
          service: 'STAY',
          amount: i.totalPrice
        })),
        subTotal: res.rooms.map(r => r.totalPrice).reduce((r1, r2) => r1 + r2),
      }
      setInvoice(inv)
    }
    finally {
      setOpenChooseResModal(false)
      setDirty(true)
    }
  }

  const confirmNoRes = () => {
    try {
      let invId = props.chat.id + (Date.now() % 10000000)
      let inv = {
        id: props.chat.id + new Date().getTime(),
        guestName: Configs.invoice.initialInvoice.guestName,
        issuer: props.displayName,
        issuerId: props.chat.username,
        checkInDate: formatISODate(new Date()),
        checkOutDate: formatISODate(addDays(new Date(), 1)),
        prepaied: false,
        paymentMethod: '',
        paymentPhotos: [],
        reservationCode: '',
        rooms: ["R1"],
        creatorId: null,
        createdBy: props.chat.username,
        sheetName: '',
        signed: false,
        country: '',
        items: [{
          id: invId + (Date.now() % 10000000),
          itemName: "Bungalow garden view",
          unitPrice: 450000,
          quantity: 1,
          service: 'STAY',
          amount: 450000
        }],
        subTotal: 450000,
      }
      setInvoice(inv)
    }
    finally {
      setOpenChooseResModal(false)
      setDirty(true)
    }
  }

  const fetchReservations = () => {
    let nextDays = Configs.reservation.fetchDays
    let fromDate = addDays(new Date(), Configs.invoice.fetchedReservation.backwardDays)
    var toDate = addDays(fromDate, nextDays) // 20 days ahead of fromDate

    var fD = formatISODate(fromDate)
    var tD = formatISODate(toDate)
    console.info("Loading reservations from %s to next %d days...", fD, nextDays)

    return listLatestReservations(fD, tD, 0, Configs.invoice.fetchedReservation.max)
  }

  const changeResFilteredText = (e: ChangeEvent<HTMLInputElement>) => {
    let text = e.target.value
    setResFilteredText(text)
    let fRes = reservations.filter(res => res.guestName.toLowerCase().includes(text.toLowerCase()))
    setFilteredReservations(fRes)
  }

  //================ ROOMS ==========================//
  const chooseRoom = () => {
    let sR = invoice
      .rooms
      .map(rN => rooms.find(r => rN === r.name))
      .filter(r => r !== undefined)
      .map(r => r.id)
    setSelectedRooms(sR)
    setOpenRoomModal(true)
  }
  const selectRoom = (roomId: string) => {
    let sR = [...selectedRooms]
    if (sR.includes(roomId)) {
      sR = selectedRooms.filter(r => r !== roomId)
    } else {
      sR.push(roomId)
    }
    setSelectedRooms(sR)
  }

  const confirmSelectRoom = () => {
    let rs = selectedRooms
      .map(rId => rooms.find(r => r.id === rId))
      .filter(r => r !== undefined)
      .map(r => r.name)

    let nInv = {
      ...invoice,
      rooms: rs
    }
    setDirty(true)
    setInvoice(nInv)
    setOpenRoomModal(false)
  }

  const cancelSelectRoom = () => {
    setSelectedRooms([])
    setOpenRoomModal(false)
  }

  //================ SHARED INVOICE ==========================//
  const sharedInvRef = useRef<HTMLDivElement>(null)
  const sharedInvImg = useRef<HTMLDivElement>(null)
  const [sharedInvData, setSharedInvData] = useState<string | null>()

  const downloadSharedInv = async () => {
    const element = sharedInvRef.current;
    if (element === null) {
      console.warn("Invalid shared invoice")
      return
    }
    const canvas = await html2canvas(element);

    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          setSharedInvData(URL.createObjectURL(blob))
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          console.log('Image copied to clipboard');
        } catch (err) {
          console.error('Failed to copy image: ', err);
        }
      }
    }, 'image/png');

  }

  return (
    <>
      <div className="h-full pt-3">
        <form className="flex flex-wrap mx-1">
          <div className="w-full px-1 mb-1">
            <div className="flex flex-wrap -mx-3 mb-1">
              <div className="w-full px-3 mb-1">
                <div className="flex w-full space-x-4 mb-1">
                  <Label
                    id="reservationCode"
                    value={"Code: " + (invoice.reservationCode === null ? "" : invoice.reservationCode)}
                    className="outline-none font-mono text-[10px] italic text-gray-700"
                  />
                  <Label
                    id="creatorId"
                    value={"Created by: " + (invoice.createdBy)}
                    className="outline-none font-mono text-[10px] italic text-gray-700"
                  />
                </div>
                <div className="flex flex-row w-full items-center">
                  <div className="flex flex-row flex-auto items-center">
                    <Label
                      id="guestName"
                      // required={true}
                      value={invoice.guestName.toUpperCase()}
                      className="text-lg pr-2 font font-bold font-sans"
                    />
                    <svg
                      className="w-[16px] h-[16px] text-gray-800 dark:text-white cursor-pointer"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      onClick={editGuestName}
                    >
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                    </svg>
                  </div>
                  <div className="flex flex-row flex-auto justify-end" >
                    {userIcons.find(u => u.id === selectedIssuer.id)?.src}
                    <Label
                      id="issuerId"
                      value={invoice.issuer}
                      className="outline-none font-mono italic pr-2"
                    />
                    <svg
                      className="w-[16px] h-[16px] text-gray-800 dark:text-white cursor-pointer"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      onClick={selectIssuer}
                    >
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap -mx-3 mb-1">
              <div className="flex flex-row w-36 px-3 mb-1 items-center">
                <Label
                  value={String(invoice?.checkInDate)}
                  className="pr-2"
                />
                <svg
                  className="w-[16px] h-[16px] text-gray-800 dark:text-white cursor-pointer"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  id="checkInDate"
                  onClick={() => editDate("checkInDate")}
                >
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                </svg>
              </div>

              <div className="flex flex-row w-36 px-3 mb-1 items-center">
                <Label
                  value={String(invoice?.checkOutDate)}
                  className="pr-2"
                />
                <svg
                  className="w-[16px] h-[16px] text-gray-800 dark:text-white cursor-pointer"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  id="checkOutDate"
                  onClick={() => editDate("checkOutDate")}
                >
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                </svg>
              </div>

              <div className="flex flex-row px-3 mb-1 items-center">
                <Label
                  value={invoice?.rooms ? invoice.rooms.join('.') : "[]"}
                  className="pr-2 w-full text-right"
                />
                <svg
                  className="w-[16px] h-[16px] text-gray-800 dark:text-white cursor-pointer"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  id="room"
                  onClick={chooseRoom}
                >
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                </svg>
              </div>
            </div>

            <div className="flex flex-wrap -mx-3 mb-3">
              <div className="flex flex-row px-3 items-center">
                <div>{paymentIcons.find(ic => ic.id === selectedPaymentMethod.id)?.src}</div>
                <Label
                  id="paymentMethod"
                  value={selectedPaymentMethod.name}
                  className="pr-2"
                />
                <svg
                  className="w-[16px] h-[16px] text-gray-800 dark:text-white cursor-pointer"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  id="paymentMethod"
                  onClick={selectPaymentMethod}
                >
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                </svg>
              </div>
              <div className="flex flex-row px-3 items-center">
                <Label
                  id="prepaied"
                  value={invoice.prepaied ? "TT" : "TS"}
                  className="pr-2"
                />
                <svg
                  className="w-[16px] h-[16px] text-gray-800 dark:text-white cursor-pointer"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  id="prepaied"
                  onClick={changePrepaied}
                >
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                </svg>
              </div>
              <div className="flex flex-row px-3 items-center">
                <Label
                  id="totalAmount"
                  value={formatVND(invoice.subTotal)}
                  className="font-bold text-red-900"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="flex flex-row w-full px-1 space-x-2">
          <Button size="xs" color="green" onClick={() => editItem(defaultEmptyItem.origin)}>
            <MdAssignmentAdd size="1.5em" className="mr-2" /> Add
          </Button>
          <Button size="xs" color="green" onClick={showViewInv}>
            <FaEye size="1.5em" className="mr-2" /> View
          </Button>
          <Button size="xs" color="green" onClick={handleSaveInvoice}>
            <HiSave size="1.5em" className="mr-2" /> Save
          </Button>
          <Button size="xs" color="green">
            <IoMdArrowBack size="1.5em" className="mr-2" />
            <Link to=".."
              relative="path"
              state={{ pageNumber: loc.pageNumber, pageSize: loc.pageSize }}>Back</Link>
          </Button>
        </div>

        <div className="flex flex-col px-2 pt-2 space-y-1.5 divide-y">
          {invoice.items.map((item) => {
            return (
              <div key={item.id} className="flex flex-col w-full px-1 space-y-1 relative">
                <div
                  className="font text-sm text-green-600"
                >
                  {item.itemName}
                </div>
                <div className="flex flex-row text-[10px] space-x-1">
                  <span className="w-6">{"x" + item.quantity}</span>
                  <span className="w-24">{formatVND(item.amount)}</span>
                  <span className="font font-mono font-black">{item.service}</span>
                </div>
                <div className="flex flex-row space-x-2 absolute right-1 top-2">
                  <IoMdRemoveCircle size="1.5em" className="mr-2 text-red-800 cursor-pointer"
                    onClick={() => askForDelItemConfirmation(item)}
                  />
                  <CiEdit size="1.5em" className="mr-2 text-green-800 cursor-pointer"
                    onClick={() => editItem(item)}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <Modal show={openGuestNameModal} onClose={cancelEditGuestName} initialFocus={guestNameTextInput}>
          <Modal.Header>Guest name</Modal.Header>
          <Modal.Body>
            <div className="text-center">
              <div className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                <TextInput
                  value={editingGuestName}
                  onChange={changeGuestName}
                  ref={guestNameTextInput}
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="flex justify-center gap-4">
            <Button onClick={confirmEditGuestName}>Done</Button>
            <Button color="gray" onClick={cancelEditGuestName}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={openEditDateModal}
          onClose={cancelEditDate}
          popup
        >
          <Modal.Header />
          <Modal.Body>
            <div className="text-center">
              <div className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                Current value <span className="font font-bold">{editingDate ? formatISODate(editingDate.value) : ""}</span>
              </div>
              <Datepicker
                onSelectedDateChanged={(date) => changeEditingDate(date)}
                id="checkInDate"
                inline
              />
            </div>
          </Modal.Body>
          <Modal.Footer className="flex justify-center gap-4">
          </Modal.Footer>
        </Modal>

        <Modal show={openDelItemModal} onClose={cancelDelItem}>
          <Modal.Body>
            <div>
              <span>{deletingItem === null || deletingItem === undefined ? "" : "Are you sure to remove [" + deletingItem.itemName + "]?"}</span>
            </div>
          </Modal.Body>
          <Modal.Footer className="flex justify-center gap-4">
            <Button onClick={confirmDelItem}>Remove</Button>
            <Button color="gray" onClick={cancelDelItem}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={openUsersModal}
          onClose={cancelSelectIssuer}
          popup
          dismissible
        >
          <Modal.Header></Modal.Header>
          <Modal.Body>
            <div className="flex flex-row items-center gap-2 space-x-2 w-full ">
              {
                issuers.map(user => {
                  return (
                    <div
                      key={user.id}
                      className="flex flex-col border-spacing-1 shadow-sm hover:shadow-lg rounded-lg items-center "
                      onClick={() => changeIssuer(user)}
                    >
                      {userIcons.find(u => u.id === user.id)?.src}
                      <span className="text text-center">{user.displayName}</span>
                    </div>
                  )
                })
              }
            </div>
          </Modal.Body>
          <Modal.Footer className="flex justify-center gap-4">
            <Button color="gray" onClick={cancelSelectIssuer}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={openPaymentModal} onClose={cancelSelectPaymentMethod}>
          <Modal.Header>Payment</Modal.Header>
          <Modal.Body>
            <div className="flex flex-row items-center w-full space-x-2">
              {
                paymentMethods.map(pM => {
                  return (
                    <div
                      className="block w-1/5" key={pM.id}
                    >
                      <img
                        src={pM.srcLargeImg}
                        alt=""
                        id={pM.id}
                        onClick={changePaymentMethod}
                      />
                    </div>
                  )
                })
              }
            </div>
          </Modal.Body>
          <Modal.Footer className="flex justify-center gap-4">
            <Button color="gray" onClick={cancelSelectPaymentMethod}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={openEditingItemModal}
          size="md"
          popup={true}
          onClose={cancelEditingItem}
        >
          <Modal.Header />
          <Modal.Body>
            <div className="space-y-6 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
              <div>
                <TextInput
                  id="itemName"
                  placeholder="Item name"
                  required={true}
                  value={editingItem.origin.itemName}
                  onChange={changeItemName}
                  rightIcon={() => <HiX onClick={emptyItemName} />}
                />
                <Table hoverable>
                  <Table.Body className="divide-y">
                    {lookupItems.map((item) => {
                      return (
                        <Table.Row
                          className=" dark:border-gray-700 dark:bg-gray-800 bg-gray-200"
                          key={item.id}
                          onClick={() => confirmSelectItem(item)}
                        >
                          <Table.Cell className="sm:px-1 px-1 py-0.5">
                            <div className="grid grid-cols-1">
                              <span
                                className={"font-medium text-blue-600 hover:underline dark:text-blue-500"}
                              >
                                {item.name}
                              </span>
                              <div className="flex flex-row text-[10px] space-x-1">
                                <div className="w-24">
                                  <span>{formatVND(item.unitPrice)}</span>
                                </div>
                              </div>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      )
                    })}
                  </Table.Body>
                </Table>


              </div>
              <div className="flex flex-row w-full align-middle">
                <div className="flex items-center w-2/5">
                  <Label
                    htmlFor="unitPrice"
                    value="Unit Price"
                  />
                </div>
                <TextInput
                  id="unitPrice"
                  placeholder="Enter amount here"
                  type="currency"
                  step={5000}
                  required={true}
                  value={editingItem.formattedUnitPrice}
                  onChange={changeUnitPrice}
                  rightIcon={HiOutlineCash}
                  className="w-full"
                />
              </div>
              <div className="flex flex-row w-full align-middle">
                <div className="flex items-center w-2/5">
                  <Label
                    htmlFor="quantity"
                    value="Quantity"
                  />
                </div>
                <div className="relative flex items-center w-full">
                  <button
                    type="button"
                    id="decrement-button"
                    data-input-counter-decrement="quantity-input"
                    className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                    onClick={() => changeQuantity(-1)}
                  >
                    <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    id="quantity-input"
                    data-input-counter aria-describedby="helper-text-explanation"
                    className="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="999"
                    required
                    value={editingItem.origin.quantity}
                    readOnly
                  />
                  <button
                    type="button"
                    id="increment-button"
                    data-input-counter-increment="quantity-input"
                    className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                    onClick={() => changeQuantity(1)}
                  >
                    <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex flex-row w-full align-middle">
                <div className="flex items-center w-2/5">
                  <Label
                    htmlFor="amount"
                    value="Amount"
                  />
                </div>
                <span className="w-full">{formatVND(editingItem.origin.amount)}</span>

              </div>
              <div className="flex flex-row w-full align-middle">
                <div className="flex items-center w-2/5">
                  <Label
                    htmlFor="service"
                    value="Service"
                  />
                </div>
                <span className="w-full">{editingItem.origin.service}</span>
                <svg xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-8 h-8"
                  onClick={blurItemName}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>

              </div>
              <div className="w-full flex justify-center">
                <Button onClick={createOrUpdateItem} className="mx-2" disabled={editingItem.origin.service === ''}>
                  Save
                </Button>
                <Button color='gray' onClick={cancelEditingItem} className="mx-2">
                  Cancel
                </Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>



      </div >

      <Modal
        show={openViewInvModal}
        popup
        onClose={closeViewInv}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="space-y-6 px-0 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
            <div className="flex flex-row pt-2">
              <div className="block w-1/5">
                <img src="/logo192.jpg" className="w-25 border border-1 rounded-2xl" alt=""></img>
              </div>
              <div className="flex flex-col w-4/5 ">
                <span className="text-right font-serif font-bold text-amber-800 capitalize">phuc sinh home</span>
                <span className="text-right font-mono text-[9px] font italic text-gray-500">Phuoc Xuan Hamlet, An Khanh Commune, Chau Thanh, Ben Tre</span>
                <span className="text-right font-mono text-[9px] font text-gray-800">+84 328 944 788</span>
              </div>
            </div>
            <div className="flex flex-row w-full">
              <div className="flex flex-col w-3/5">
                <span className="font uppercase font-serif text-sm font-bold">{invoice.guestName}</span>
                <span className="font text-gray-400 text-[8px]">{"No: " + (invoice.reservationCode === null ? "" : invoice.reservationCode)}</span>
              </div>
              <div className="flex w-2/5">
                <span className="text-right text-[12px] from-neutral-400 w-full">{formatShortDate(new Date(invoice.checkOutDate))}</span>
              </div>
            </div>
            <div className="w-full" >
              <Table hoverable>
                <Table.Head className="my-1">
                  <Table.HeadCell className="py-2 pl-0">
                    Item Name
                  </Table.HeadCell>
                  <Table.HeadCell className="py-2 text-right px-1">
                    Amount
                  </Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y" >
                  {invoice.items.map((item) => {
                    return (
                      <Table.Row
                        className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm w-full"
                        key={item.id}
                      >
                        <Table.Cell className="py-0 pl-0 pr-1">
                          <div className="grid grid-cols-1 py-0 my-0">
                            <div
                              className="font text-sm text-blue-600 font-sans font-semibold hover:underline dark:text-blue-500"
                            >
                              {item.itemName}
                            </div>
                            <div className="flex flex-row text-[9px] space-x-1">
                              <span className="w-6">{"x" + item.quantity}</span>
                              <span className="w-24">{formatVND(item.unitPrice)}</span>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell className="text-right py-0 px-1">
                          {formatVND(item.amount)}
                        </Table.Cell>
                      </Table.Row>
                    )
                  })}
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm">
                    <Table.Cell className="text-center py-0">
                      SUBTOTAL
                    </Table.Cell>
                    <Table.Cell className="text-right px-1 py-0">
                      {formatVND(invoice.subTotal)}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm">
                    <Table.Cell className="text-center py-0">
                      {"FEE (" + selectedPaymentMethod.feeRate * 100 + "%)"}
                    </Table.Cell>
                    <Table.Cell className="text-right py-0 px-1">
                      {formatVND(invoice.subTotal * selectedPaymentMethod.feeRate)}
                    </Table.Cell>
                  </Table.Row>
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm">
                    <Table.Cell className="text-center py-0">
                      GRAND TOTAL
                    </Table.Cell>
                    <Table.Cell className="text-right text-red-800 py-0 px-1">
                      {formatVND(invoice.subTotal + invoice.subTotal * selectedPaymentMethod.feeRate)}
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table>
            </div>
            <div className="flex flex-col justify-items-center w-full">
              <span className="text-center">Payment Info</span>
              <div className="flex justify-center w-full">
                <img
                  src={selectedPaymentMethod.paymentInfo}
                  alt=""
                  className="border rounded-lg w-4/5 max-w-fit"
                />
              </div>
              <span className="text-center font italic font-serif">Thank you so much !</span>
            </div>
          </div>


          <div className="absolute z-[-1] top-0 left-0 w-full h-44 overflow-y-scroll">
            <div
              className="space-y-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8 w-full px-4 py-4"
              ref={sharedInvRef}
            >
              <div className="flex flex-row w-full">
                <div className="flex flex-col w-3/5">
                  <span className="font uppercase font-serif text-sm font-bold">{invoice.guestName}</span>
                  <span className="font text-gray-400 text-[8px]">{"No: " + (invoice.reservationCode === null ? "" : invoice.reservationCode)}</span>
                </div>
                <div className="flex w-2/5">
                  <span className="text-right text-[12px] from-neutral-400 w-full">{formatShortDate(new Date(invoice.checkOutDate))}</span>
                </div>
              </div>
              <div className="w-full" >
                <Table hoverable>
                  <Table.Head className="my-1">
                    <Table.HeadCell className="py-0 pl-0 pb-3">
                      Item Name
                    </Table.HeadCell>
                    <Table.HeadCell className="py-0 text-right px-1 pb-3">
                      Amount
                    </Table.HeadCell>
                  </Table.Head>
                  <Table.Body className="divide-y" >
                    {invoice.items.map((exp) => {
                      return (
                        <Table.Row
                          className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm my-1 py-0 w-full"
                          key={exp.id}
                        >
                          <Table.Cell className="py-0 pl-0 pr-1">
                            <div className="grid grid-cols-1 py-0 my-0 pb-3">
                              <div
                                className="font text-sm text-blue-600 font-sans font-semibold hover:underline dark:text-blue-500"
                              >
                                {exp.itemName}
                              </div>
                              <div className="flex flex-row text-[9px] space-x-1">
                                <span className="w-6">{"x" + exp.quantity}</span>
                                <span className="w-24">{formatVND(exp.unitPrice)}</span>
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell className="text-right py-0 px-1 pb-3">
                            {formatVND(exp.amount)}
                          </Table.Cell>
                        </Table.Row>
                      )
                    })}
                    <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm">
                      <Table.Cell className="text-center py-0 pb-3">
                        SUBTOTAL
                      </Table.Cell>
                      <Table.Cell className="text-right px-1 py-0 pb-3">
                        {formatVND(invoice.subTotal)}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm">
                      <Table.Cell className="text-center py-0 pb-3">
                        {"FEE (" + selectedPaymentMethod.feeRate * 100 + "%)"}
                      </Table.Cell>
                      <Table.Cell className="text-right py-0 px-1 pb-3">
                        {formatVND(invoice.subTotal * selectedPaymentMethod.feeRate)}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm">
                      <Table.Cell className="text-center py-0 pb-3">
                        GRAND TOTAL
                      </Table.Cell>
                      <Table.Cell className="text-right py-0 px-1 pb-3 text-red-800">
                        {formatVND(invoice.subTotal + invoice.subTotal * selectedPaymentMethod.feeRate)}
                      </Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table>
              </div>
            </div>
          </div>

          <div ref={sharedInvImg} >
            <div className="w-full text-center" hidden={sharedInvData == null}>
              <span
                className="font-sans italic pb-2 text-amber-700"
              >Copied to <span className="text font-bold">Clipboard</span>
              </span>
            </div>
            {
              sharedInvData && (<div className="flex flex-col items-center" hidden={sharedInvData == null}>
                <img
                  src={sharedInvData}
                  alt=""
                  className="h-40 rounded-sm shadow-xl"
                />
              </div>)
            }

          </div>

        </Modal.Body>
        <Modal.Footer className="flex flex-col items-center py-2">
          <Button onClick={downloadSharedInv} >
            <HiOutlineClipboardCopy className="mr-2 h-5 w-5" />
            Create shared invoice
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={openChooseResModal} onClose={cancelChooseRes} popup dismissible initialFocus={filteredResText}>
        <Modal.Header>Choose reservation</Modal.Header>
        <Modal.Body>
          <div className="w-full">
            <TextInput
              value={resFilteredText}
              onChange={changeResFilteredText}
              placeholder="Guest name"
              ref={filteredResText}
            />
          </div>
          <div className="flex flex-col overflow-scroll w-full">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell className="pr-1">
                  Check In
                </Table.HeadCell>
                <Table.HeadCell className="pr-1">
                  Guest Details
                </Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {filteredReservations.map((res) => {
                  return (
                    <Table.Row
                      className="bg-white"
                      key={res.id}
                    >
                      <Table.Cell className=" pr-1 py-0.5">
                        <Moment format="DD.MM">{new Date(res.checkInDate)}</Moment>
                      </Table.Cell>
                      <Table.Cell className="sm:px-1 px-1 py-0.5">
                        <div className="grid grid-cols-1">
                          <span
                            className={"font-medium text-blue-600 hover:underline dark:text-blue-500"}
                            onClick={() => confirmSelectRes(res)}
                          >
                            {res.guestName}
                          </span>
                          <div className="flex flex-row text-[10px] space-x-1">
                            <div className="w-24">
                              <span>{res.code}</span>
                            </div>
                            <span className="font font-mono font-black w-24">{res.channel}</span>
                            <span className="font font-mono font-black text-amber-700">{res.rooms ? internalRooms(res.rooms).join(',') : ""}</span>
                          </div>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={confirmNoRes}>No Book</Button>
          <Link to={"../invoice"}>Cancel</Link>
        </Modal.Footer>
      </Modal>


      <Modal
        show={openRoomModal}
        onClose={cancelSelectRoom}
        popup
        dismissible
      >
        <Modal.Header></Modal.Header>
        <Modal.Body>
          <div className="flex flex-row items-center gap-2 space-x-2 w-full ">
            {
              rooms.map(room => {
                return (
                  <div
                    id={room.id}
                    key={room.id}
                    className={selectedRooms.includes(room.id) ?
                      "flex flex-col border-spacing-1 shadow-lg hover:shadow-lg rounded-sm items-center px-2 py-2 bg-slate-300" :
                      "flex flex-col border-spacing-1 shadow-lg hover:shadow-lg rounded-sm items-center px-2 py-2"
                    }
                    onClick={() => selectRoom(room.id)}
                  >
                    {roomIcons.find(r => r.id === room.id)?.src}
                    <span className="text text-center">{room.name}</span>
                  </div>
                )
              })
            }
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={confirmSelectRoom}>
            Done
          </Button>
          <Button color="gray" onClick={cancelSelectRoom}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
