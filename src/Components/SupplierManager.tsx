import React, { useState, useEffect, ChangeEvent, useRef } from "react";
import { Link } from "react-router-dom";
import { formatISODate, formatISODateTime, formatMoneyAmount, formatVND, randomId, utcToHourMinute } from "../Service/Utils";
import { Chat, DEFAULT_PAGE_SIZE } from "../App";
import { Button, Label, Modal, Spinner, TextInput } from "flowbite-react";
import { InvoiceItem } from "./InvoiceManager";
import { HiMail, HiOutlineCash, HiX } from "react-icons/hi";
import { GiCoinflip, GiMeal } from "react-icons/gi";
import { SERVICE_NAMES } from "../Service/ItemClassificationService";
import { generateSInvoice, listSupplierInvoices, saveSInvoice } from "../db/supplier";
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
  confirmedTime: string,
  paidTime: string,
  issuerId: string,
  items: InvoiceItem[],
  description: string,
  subTotal: number
}

const emptySInvoice = {
  supplierId: '1111111',
  id: '',
  name: '',
  status: "CREATED" as SIStatus,
  createdTime: '',
  confirmedTime: '',
  paidTime: '',
  issuerId: '',
  items: [],
  description: '',
  subTotal: 0
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

export const SupplierManager = (props: SupplierManagerProps) => {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([])


  const [showItemDetail, setShowItemDetail] = useState(false)
  const [eItem, setEItem] = useState<EInvoiceItem>(emptyItem)

  const [eInvoice, setEInvoice] = useState<SupplierInvoice>(emptySInvoice)
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [invoiceTxt, setInvoiceTxt] = useState('')
  const services = SERVICE_NAMES

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


  const fetchInvoices = () => {
    let fromTime = formatISODateTime(new Date())
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
  }

  const generate = () => {
    if (invoiceTxt === '') {
      return
    }
    setGenerating(true)
    generateSInvoice(invoiceTxt)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              console.info("Generate invoice successfully")
              editInvoice(data)
            })
        }
      }).finally(() => {
        setGenerating(false)
      })
  }

  const editInvoice = (invoice: SupplierInvoice) => {
    setEInvoice(invoice)
    setShowInvoiceDetail(true)
  }

  const createInvoice = () => {
    editInvoice(emptySInvoice)
  }

  const saveInvoice = () => {
    if (!eInvoice) {
      return
    }
    let createdTime = formatISODateTime(new Date())
    let inv: SupplierInvoice = {
      ...eInvoice,
      issuerId: props.chat.id,
      supplierId: emptySInvoice.supplierId,
      createdTime: createdTime,
      items: eInvoice.items.map(i => {
        return {
          ...i,
          id: randomId()
        }
      })
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

  const changeSupplierName = (e: ChangeEvent<HTMLInputElement>) => {
    setEInvoice({
      ...eInvoice,
      name: e.target.value
    })
  }

  const emptySupplierName = () => {
    setEInvoice({
      ...eInvoice,
      name: ''
    })
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
    setEItem(item)
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
      amount: uP.amount * eItem.quantity
    })
  }

  const hideItemDetail = () => {
    setShowItemDetail(false)
  }

  const textInputColor = (txt: string) => {
    return txt === '' ? 'failure' : 'gray'
  }

  return (
    <div className="h-full pt-3 relative">
      <div className="flex flex-row">
        <Button className="font text-sm" onClick={createInvoice}>Add</Button>
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
                    {invoice.confirmedTime ? <div className="flex flex-row items-center rounded-sm">
                      <GiMeal />
                      <span className="font font-mono text-gray-500 text-[12px]">{utcToHourMinute(invoice.confirmedTime)}
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
                <div className="bg-zinc-200 rounded-sm py-0.5 w-24 text-center">
                  <span className={"font font-mono " + SInvoiceStatus[invoice.status]}>{invoice.status}</span>
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
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="name"
                  value="Name"
                />
              </div>
              <TextInput
                id="name"
                placeholder="Name of the supplier"
                type="text"
                required={true}
                value={eInvoice?.name}
                onChange={changeSupplierName}
                rightIcon={() => <HiX onClick={emptySupplierName} />}
                className="w-full"
                color={textInputColor(eInvoice.name)}
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
          <div className="flex flex-col px-2 overflow-hidden space-y-1.5">
            {eInvoice?.items.map((item) => {
              return (
                <div
                  className="flex flex-row items-center border border-gray-300 shadow-2xl rounded-md bg-white dark:bg-slate-500 "
                  key={item.id}
                >
                  <div className="w-full">
                    <div className="grid grid-cols-1">
                      <div className="flex flex-row">
                        <Link
                          to={item.id + "/" + props.chat.id}
                          state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                          className="font-medium text-blue-600 hover:underline dark:text-blue-500 overflow-hidden"
                        >
                          {item.itemName}
                        </Link>
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
        </Modal.Body>
        <Modal.Footer className="flex justify-center">
          <Button onClick={saveInvoice}>
            Save
          </Button>
          <Button onClick={hideInvoiceDetail} color="gray">
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>


      <Modal
        show={showItemDetail}
        popup={true}
        onClose={hideItemDetail}
      >
        <Modal.Header />
        <Modal.Body>
          <span className="font italic">Item Details</span>
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
                value={eItem?.formattedUnitPrice}
                onChange={changeUnitPrice}
                rightIcon={HiOutlineCash}
                className="w-full"
              />
            </div>
            <div className="flex w-full items-center mb-2 text-center">
              <button
                type="button"
                id="decrement-button"
                data-input-counter-decrement="quantity-input"
                className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg py-1 px-2 h-7 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
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
                className="bg-gray-50 border-x-0 border-gray-300 h-7 w-full min-w-min text-center text-gray-900 block py-1"
                placeholder="9"
                required
                value={eItem?.quantity}
                readOnly
              />
              <button
                type="button"
                id="increment-button"
                data-input-counter-increment="quantity-input"
                className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg py-1 px-2 h-7 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                onClick={() => changeQuantity(1)}
              >
                <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
                </svg>
              </button>
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
            <div className="flex flex-col w-full align-middle px-2 py-1">
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
          <Button onClick={hideItemDetail} disabled={eItem.itemName === ''}>
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
