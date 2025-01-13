import React, { useState, useEffect, ChangeEvent, useRef } from "react";
import { formatISODateTime, formatMoneyAmount, formatVND, randomId, utcToHourMinute } from "../Service/Utils";
import { Chat, DEFAULT_PAGE_SIZE } from "../App";
import { Button, Label, Modal, Spinner, TextInput } from "flowbite-react";
import { InvoiceItem } from "./InvoiceManager";
import { HiMail, HiOutlineCash, HiX } from "react-icons/hi";
import { GiCoinflip, GiMeal } from "react-icons/gi";
import { SERVICE_NAMES } from "../Service/ItemClassificationService";
import { generateSInvoice, listSupplierInvoices, listSupplierInvoicesByTimeAndStatus, paidSInvoice, rejectSInvoice, saveSInvoice, takenPlaceSInvoice } from "../db/supplier";
import { PiBrainThin } from "react-icons/pi";

export const SInvoiceStatus = {
  CREATED: 'text-orange-400',
  CONFIRMED: 'text-green-700',
  REJECTED: 'text-red-700',
  TAKEN_PLACE: 'text-gray-700',
  PAID: 'text-gray-700'
}

type SIStatus = keyof typeof SInvoiceStatus

export type SupplierInvoice = {
  supplierId: string,
  id: string,
  name: string,
  status: SIStatus,
  createdTime: string,
  takenPlaceAt: string,
  paidTime: string,
  issuerId: string,
  items: InvoiceItem[],
  description: string,
  subTotal: number,
  paymentPhotos: string[],
  paymentMethod: string,
}

const emptySInvoice = {
  supplierId: '1111111',
  id: '',
  name: 'Mekong Tour Comp',
  status: "CREATED" as SIStatus,
  createdTime: '',
  takenPlaceAt: '',
  paidTime: '',
  issuerId: '',
  items: [],
  description: '',
  subTotal: 0,
  paymentPhotos: [],
  paymentMethod: '',
}

const emptyItem = {
  id: '',
  itemName: '',
  unitPrice: 0,
  quantity: 0,
  amount: 0,
  service: '',
  formattedUnitPrice: ''
}

interface EInvoiceItem extends InvoiceItem {
  formattedUnitPrice: string
}

type SupplierManagerProps = {
  chat: Chat,
  authorizedUserId: string | null,
  displayName: string,
  activeMenu: any
}

const sampleSInvoice: SupplierInvoice = {
  "id": '',
  "supplierId": '',
  "description": "Tour Mekong morning 11.01.2024",
  "name": 'Linh',
  "createdTime": "2024-01-11T08:00:00",
  "takenPlaceAt": '',
  "paidTime": '',
  "status": 'CREATED',
  "issuerId": '',
  "items": [
    {
      "id": '114534543',
      "itemName": "Base tour price",
      "unitPrice": 800000,
      "quantity": 1,
      "service": "TOUR",
      "amount": 800000
    },
    {
      "id": '223454545',
      "itemName": "Additional adult fee",
      "unitPrice": 100000,
      "quantity": 1,
      "service": "TOUR",
      "amount": 100000
    },
    {
      "id": '3345465',
      "itemName": "Additional coconut fee",
      "unitPrice": 10000,
      "quantity": 5,
      "service": "TOUR",
      "amount": 50000
    }
  ],
  "paymentPhotos": [''],
  "paymentMethod": '',
  "subTotal": 950000
}

export const SupplierManager = (props: SupplierManagerProps) => {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([])


  const [showItemDetail, setShowItemDetail] = useState(false)
  const [eItem, setEItem] = useState<EInvoiceItem>(emptyItem)

  const [eInvoice, setEInvoice] = useState<SupplierInvoice>(emptySInvoice)
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [invoiceTxt, setInvoiceTxt] = useState('')
  const services = SERVICE_NAMES
  const filterStatuses: string[] = ['CONFIRMED', 'TAKEN_PLACE', 'PAID']
  const [statuses, setStatuses] = useState<string[]>([])

  const [resultMessage, setResultMessage] = useState('')

  const invoiceTxtRef = useRef<HTMLInputElement>(null)

  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0
  })

  const handlePaginationClick = (pageNumber: number) => {
    console.log(`Pagination nav bar click to page ${pageNumber}`)
    var pNum = pageNumber < 0 ? 0 : pageNumber > pagination.totalPages - 1 ? pagination.totalPages - 1 : pageNumber;
    setPagination({
      ...pagination,
      pageNumber: pNum
    })
  }

  useEffect(() => {
    fetchInvoices()
    props.activeMenu()
    // eslint-disable-next-line
  }, [pagination.pageNumber]);

  useEffect(() => {
    if (showInvoiceDetail) {
      return
    }
    fetchInvoices()
    // eslint-disable-next-line
  }, [showInvoiceDetail]);

  useEffect(() => {
    // if (statuses.length <= 0) {
    //   return
    // }
    fetchInvoices()
    // eslint-disable-next-line
  }, [statuses.length]);


  const fetchInvoices = () => {
    let createdTime = new Date()
    createdTime.setDate(createdTime.getDate() - 5)
    createdTime.setHours(0, 0, 0, 0)
    let fromTime = formatISODateTime(createdTime)

    if (statuses.length > 0) {
      listSupplierInvoicesByTimeAndStatus(fromTime, statuses, pagination.pageNumber, pagination.pageSize)
        .then(rsp => {
          if (rsp.ok) {
            rsp.json()
              .then(data => {
                setInvoices(data.content)
                if (data.totalPages !== pagination.totalPages) {
                  setPagination({
                    ...pagination,
                    totalPages: data.totalPages
                  })
                }
              })
          }
        })
      return
    }
    listSupplierInvoices(fromTime, pagination.pageNumber, pagination.pageSize)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setInvoices(data.content)
              if (data.totalPages !== pagination.totalPages) {
                setPagination({
                  ...pagination,
                  totalPages: data.totalPages
                })
              }
            })
        }
      })
  }

  const pageClass = (pageNum: number) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  const hideInvoiceDetail = () => {
    setShowInvoiceDetail(false)
    setResultMessage('')
  }

  const generate = () => {
    if (invoiceTxt === '') {
      return
    }
    if (eInvoice.status === "PAID") {
      console.warn("Cannot edit paid invoice")
      return
    }
    setGenerating(true)
    generateSInvoice(invoiceTxt)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then((data: SupplierInvoice) => {
              console.info("Generate invoice successfully")
              let nItems = data.items.map((item: InvoiceItem) => {
                return {
                  ...item,
                  id: randomId()
                }
              })

              setEInvoice({
                ...eInvoice,
                description: data.description,
                subTotal: data.subTotal,
                createdTime: formatISODateTime(new Date(data.createdTime)),
                items: nItems
              })
            })
        }
      }).finally(() => {
        setGenerating(false)
      })
  }

  const editInvoice = (invoice: SupplierInvoice) => {
    setInvoiceTxt('')
    setEInvoice(invoice)
    setShowInvoiceDetail(true)
  }

  const createInvoice = () => {
    // editInvoice(emptySInvoice)
    editInvoice(sampleSInvoice)
  }

  const confirmInvoice = () => {
    let inv: SupplierInvoice = {
      ...eInvoice,
      status: 'CONFIRMED'
    }

    saveSInvoice(inv)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then((data: SupplierInvoice) => {
              console.info(`Confirm invoice ${data.id} successfully`)
              setEInvoice(data)
            })
        }
      })
  }
  const takenPlaceInvoice = () => {
    let inv: SupplierInvoice = {
      ...eInvoice,
      takenPlaceAt: eInvoice.createdTime
    }

    takenPlaceSInvoice(inv)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then((data: SupplierInvoice) => {
              console.info(`Taken place invoice ${data.id} successfully`)
              setEInvoice(data)
              setResultMessage(`Taken place successfully`)
            })
        }
      }).finally(() => {
        setShowInvoiceDetail(true)
      })
  }

  const paidInvoice = () => {
    let inv: SupplierInvoice = {
      ...eInvoice,
      paidTime: formatISODateTime(new Date())
    }

    paidSInvoice(inv)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then((data: SupplierInvoice) => {
              console.info(`Paid invoice ${data.id} successfully`)
              setEInvoice(data)
              setResultMessage(`Paid successfully`)
            })
        }
      })
  }

  const rejectInvoice = () => {
    let inv: SupplierInvoice = {
      ...eInvoice,
      status: 'REJECTED'
    }

    rejectSInvoice(inv.id, props.chat.id)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then((data: string) => {
              console.info(`Reject invoice ${inv.id} successfully`)
              setEInvoice(inv)
            })
        }
      })
  }

  const saveInvoice = () => {
    if (!eInvoice) {
      return
    }

    let inv: SupplierInvoice = {
      ...eInvoice
    }

    if (inv.id === undefined || inv.id === '') {
      let createdTime = eInvoice.createdTime === '' ? formatISODateTime(new Date()) : eInvoice.createdTime
      inv = {
        ...eInvoice,
        issuerId: props.chat.id,
        createdTime: createdTime
      }
      console.info(`New supplier invoice has been created at ${createdTime}`)
    }


    saveSInvoice(inv)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then((data: SupplierInvoice) => {
              console.info(`Save invoice ${data.id} successfully`)
            })
        }
      }).finally(() => {
        setShowInvoiceDetail(false)
        setEInvoice(emptySInvoice)
      })
  }



  const changeInvoiceTxt = (e: ChangeEvent<HTMLInputElement>) => {
    setInvoiceTxt(e.target.value)
  }

  const emptyInvoiceTxt = () => {
    setInvoiceTxt('')
  }

  const changeDescription = (e: ChangeEvent<HTMLInputElement>) => {
    setEInvoice({
      ...eInvoice,
      description: e.target.value
    })
  }

  const emptyDescription = () => {
    setEInvoice({
      ...eInvoice,
      description: ''
    })
  }

  const editItem = (item: EInvoiceItem) => {
    let uP = formatMoneyAmount(String(item.unitPrice))
    setEItem({
      ...item,
      formattedUnitPrice: uP.formattedAmount
    })
    setShowInvoiceDetail(false)
    setShowItemDetail(true)
  }

  const changeService = (service: string) => {
    setEItem({
      ...eItem,
      service: service
    })
  }

  const changeItemName = (e: ChangeEvent<HTMLInputElement>) => {
    setEItem({
      ...eItem,
      itemName: e.target.value
    })
  }

  const emptyItemName = () => {
    setEItem({
      ...eItem,
      itemName: ''
    })
  }

  const changeQuantity = (delta: number) => {
    let nQ = eItem.quantity + delta < 0 ? 0 : eItem.quantity + delta
    setEItem({
      ...eItem,
      quantity: nQ,
      amount: nQ * eItem.unitPrice
    })
  }

  const changeUnitPrice = (e: ChangeEvent<HTMLInputElement>) => {
    let nUP = e.target.value
    let uP = formatMoneyAmount(nUP)
    setEItem({
      ...eItem,
      unitPrice: uP.amount,
      amount: uP.amount * eItem.quantity,
      formattedUnitPrice: uP.formattedAmount
    })
  }

  const hideItemDetail = () => {
    setShowItemDetail(false)
    setShowInvoiceDetail(true)
  }

  const saveItem = () => {
    let idx = eInvoice.items.findIndex(e => e.id === eItem.id)
    let nItems = [...eInvoice.items]
    nItems.splice(idx, 1, eItem)
    setEInvoice({
      ...eInvoice,
      items: nItems,
      subTotal: nItems.map(i => i.amount).reduce((i1, i2) => i1 + i2)
    })
    hideItemDetail()
  }

  const textInputColor = (txt: string) => {
    return txt === '' ? 'failure' : 'gray'
  }

  const filterStatus = (status: string) => {
    let uS = [...statuses]
    let idx = uS.indexOf(status)
    console.info(`Idx of status ${status} is ${idx}`)
    if (idx >= 0) {
      uS.splice(idx, 1)
    } else {
      uS = [...statuses, status]
    }
    console.log(uS)
    setStatuses(uS)
  }

  return (
    <div className="h-full pt-3 space-y-3 relative">
      <div className="flex flex-row px-2 space-x-3">
        <Button onClick={createInvoice}>Add</Button>
        <div className="flex flex-row space-x-2">
          {
            filterStatuses.map((status) => <Label
              className={statuses.includes(status) ?
                "font font-mono text-sm font-bold text-gray-500 border rounded-sm px-1 py-1 h-fit bg-slate-400"
                : "font font-mono text-sm font-bold text-gray-500 border rounded-sm px-1 py-1 h-fit bg-slate-50"}
              onClick={() => filterStatus(status)}>{status}</Label>)
          }
        </div>
      </div>
      <div className="flex flex-row px-2 space-x-3">
        {invoices.length > 0 ? <div className="space-x-1">
          <Label>Total:</Label>
          <Label>{formatVND(invoices.map(i => i.subTotal).reduce((i1, i2) => i1 + i2))}</Label>
        </div> : <></>
        }
      </div>
      <div className="flex flex-col px-2 overflow-hidden space-y-1.5">
        {invoices.map((invoice) => {
          return (
            <div
              className="flex flex-row items-center border border-gray-300 shadow-2xl rounded-md px-2 bg-white dark:bg-slate-500 "
              key={invoice.id}
            >
              <div className="w-full">
                <div className="grid grid-cols-1">
                  <div className="flex flex-row text-sm">
                    <span
                      className="font-sans text-green-800 hover:underline overflow-hidden"
                      onClick={() => editInvoice(invoice)}
                    >
                      {invoice.description}
                    </span>
                  </div>
                  <div className="flex flex-row text-sm space-x-3">
                    <div className="flex flex-row items-center rounded-sm">
                      <GiCoinflip />
                      <span className="font font-mono text-gray-500 text-[12px]">{formatVND(invoice.subTotal)}</span>
                    </div>
                    <div className="flex flex-row items-center rounded-sm">
                      <HiMail />
                      <span className="font font-mono text-gray-500 text-[12px]">{utcToHourMinute(invoice.createdTime)}</span>
                    </div>
                    {invoice.takenPlaceAt ? <div className="flex flex-row items-center rounded-sm">
                      <GiMeal />
                      <span className="font font-mono text-gray-500 text-[12px]">{utcToHourMinute(invoice.takenPlaceAt)}
                      </span></div> : <></>
                    }
                    {invoice.paidTime ? <div className="flex flex-row items-center rounded-sm">
                      <GiMeal />
                      <span className="font font-mono text-gray-500 text-[12px]">{utcToHourMinute(invoice.paidTime)}
                      </span></div> : <></>
                    }
                  </div>
                </div>
              </div>
              <div className="pl-0.2 pr-1">
                <div className="bg-zinc-200 rounded-sm w-24 text-center">
                  <span className={`font font-mono ${SInvoiceStatus[invoice.status]}`}>{invoice.status}</span>
                </div>
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
        show={showInvoiceDetail}
        popup={true}
        onClose={hideInvoiceDetail}
        initialFocus={invoiceTxtRef}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="flex flex-col w-full pb-4">
            <TextInput
              id="invoiceTxt"
              placeholder="8h 31/12 mekong 6 adults"
              required={true}
              value={invoiceTxt}
              onChange={changeInvoiceTxt}
              className="w-full"
              icon={() => <HiX onClick={emptyInvoiceTxt} />}
              rightIcon={() => generating ?
                <Spinner aria-label="Default status example"
                  className="w-14 h-10"
                />
                : <PiBrainThin
                  onClick={() => generate()}
                  className="pointer-events-auto cursor-pointer w-14 h-10"
                />
              }
              ref={invoiceTxtRef}
            />
          </div>
          <div className="flex flex-col space-y-2 pb-2">
            <div className="flex flex-row w-full align-middle space-x-4">
              <Label
                value={eInvoice.name}
              />
              <Label className="font font-mono text-sm text-amber-800"
                value={formatVND(eInvoice.subTotal)}
              />
            </div>

            <div className="flex flex-col w-full align-middle">
              <div className="flex items-center">
                <Label
                  htmlFor="description"
                  value="Description"
                />
              </div>
              <TextInput
                id="description"
                placeholder="Summary of the invoice"
                type="text"
                required={true}
                value={eInvoice?.description}
                onChange={changeDescription}
                rightIcon={() => <HiX onClick={emptyDescription} />}
                className="w-full"
                color={textInputColor(eInvoice.description)}
              />
            </div>
          </div>
          <div className="flex flex-col overflow-hidden space-y-1.5">
            {eInvoice?.items.map((item) => {
              return (
                <div
                  className="flex flex-row items-center border border-gray-300 shadow-xl pl-2 rounded-md bg-white dark:bg-slate-500 "
                  key={item.id}
                >
                  <div className="w-full">
                    <div className="grid grid-cols-1">
                      <div className="flex flex-row">
                        <span
                          className="font-medium text-green-800 hover:underline dark:text-blue-500 overflow-hidden"
                        >
                          {item.itemName}
                        </span>
                      </div>
                      <div className="flex flex-row text-sm space-x-3">
                        <div className="flex flex-row items-center rounded-sm">
                          <HiMail />
                          <span className="font font-mono text-gray-500 text-[12px]">{formatVND(item.amount)}</span>
                        </div>
                        <div className="flex flex-row items-center rounded-sm">
                          <GiMeal />
                          <span className="font font-mono text-gray-500 text-[12px]">{item.service}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pl-0.2 pr-1">
                    <svg
                      className="w-[16px] h-[16px] text-gray-800 dark:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                      onClick={() => editItem(item as EInvoiceItem)}
                    >
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="pt-3 text-center">
            <span className="font italic text-green-800">{resultMessage}</span>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center">
          {
            eInvoice.status !== 'PAID' && eInvoice.status !== 'REJECTED' ? <Button onClick={saveInvoice}>Save</Button> : <></>
          }
          {
            eInvoice.status === 'CREATED' && eInvoice.id !== '' ? <Button onClick={confirmInvoice}>Confirm</Button> : <></>
          }
          {
            eInvoice.status === 'CONFIRMED' ? <Button onClick={takenPlaceInvoice}>Taken place</Button> : <></>
          }
          {
            eInvoice.status === 'TAKEN_PLACE' ? <Button onClick={paidInvoice}>Paid</Button> : <></>
          }
          {
            (eInvoice.status === 'CREATED' || eInvoice.status === 'CONFIRMED') && eInvoice.id !== '' ? <Button onClick={rejectInvoice} color='red'>Reject</Button> : <></>
          }
        </Modal.Footer>
      </Modal>

      <Modal
        show={showItemDetail}
        popup={true}
        onClose={hideItemDetail}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="flex flex-col space-y-6 pb-4">
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="name"
                  value="Name"
                />
              </div>
              <TextInput
                id="name"
                placeholder="Name of the invoice item"
                type="text"
                required={true}
                value={eItem?.itemName}
                onChange={changeItemName}
                rightIcon={() => <HiX onClick={emptyItemName} />}
                className="w-full"
                color={eItem.itemName ? 'gray' : 'failure'}
                disabled={eInvoice.status === 'PAID'}
              />
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
                placeholder="Unit price of the item"
                type="currency"
                step={5000}
                required={true}
                value={eItem.formattedUnitPrice}
                onChange={changeUnitPrice}
                rightIcon={HiOutlineCash}
                className="w-full"
                disabled={eInvoice.status === 'PAID'}
              />
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="quantity"
                  value="Quantity"
                />
              </div>
              <div className="flex w-full h-9 items-center text-center">
                <button
                  type="button"
                  id="decrement-button"
                  data-input-counter-decrement="quantity-input"
                  className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg px-2 h-full focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                  onClick={() => changeQuantity(-1)}
                  disabled={eInvoice.status === 'PAID'}
                >
                  <svg className="w-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16" />
                  </svg>
                </button>
                <input
                  type="number"
                  id="quantity"
                  data-input-counter aria-describedby="helper-text-explanation"
                  className="bg-gray-50 border-x-0 border-gray-300 w-full min-w-min h-full text-center text-gray-900 block"
                  placeholder="9"
                  required
                  value={eItem?.quantity}
                  readOnly
                />
                <button
                  type="button"
                  id="increment-button"
                  data-input-counter-increment="quantity-input"
                  className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg px-2 h-full focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                  onClick={() => changeQuantity(1)}
                  disabled={eInvoice.status === 'PAID'}
                >
                  <svg className="w-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex flex-col w-full align-middle border rounded-md px-2 py-1">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="group"
                  value="Group"
                />
              </div>
              <div className="flex flex-row space-x-2">
                {
                  services.map((group) => <div
                    key={group}
                    className={eItem?.service === group ? "border rounded-sm px-1 bg-slate-500" : "border rounded-sm px-1 bg-slate-200"}
                    onClick={() => changeService(group)}>
                    {group.toUpperCase()}
                  </div>)
                }
              </div>
            </div>
            <div className="flex flex-row w-full align-middle px-2 py-1">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="amount"
                  value="Amount"
                />
              </div>
              <TextInput
                id="amount"
                required={false}
                disabled
                value={eItem?.amount ? formatVND(eItem?.amount) : ''}
                className="w-full"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center">
          <Button onClick={saveItem} disabled={eItem.itemName === '' || eInvoice.status === 'PAID'}>
            Save
          </Button>
          <Button onClick={hideItemDetail} color='gray'>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
}
