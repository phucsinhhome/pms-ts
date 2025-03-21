import React, { useState, useEffect, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Button, Modal, Table, TextInput } from "flowbite-react";
import Moment from "react-moment";
import { DEFAULT_PAGE_SIZE } from "../App";
import { HiOutlineExclamationCircle, HiX } from "react-icons/hi";
import { formatISODate, formatVND } from "../Service/Utils";
import { deleteInvoice, listInvoiceByGuestName, listStayingAndComingInvoices } from "../db/invoice";
import { Pagination } from "./ProfitReport";
import { GiHouse } from "react-icons/gi";

export type InvoiceItem = {
  id: string,
  itemName: string,
  unitPrice: number,
  quantity: number,
  amount: number,
  service: string
}
export type Room = {
  id: string,
  name: string,
  internalRoomName: string
}
export type Invoice = {
  id: string,
  guestName: string,
  issuer: string,
  issuerId: string,
  subTotal: number,
  checkInDate: string,
  checkOutDate: string,
  prepaied: boolean,
  paymentMethod: string,
  reservationCode: string,
  creatorId: string,
  sheetName: string,
  country: string,
  signed: boolean,
  items: InvoiceItem[],
  rooms: string[]
}

export type Issuer = {
  id: string,
  displayName: string
}

type InvoiceManagerProps = {
  activeMenu: any
}


export const InvoiceManager = (props: InvoiceManagerProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([])

  const [fromDate, setFromDate] = useState(new Date());
  const [deltaDays, setDeltaDays] = useState(0)

  const [pagination, setPagination] = useState<Pagination>({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0
  })

  const [openModal, setOpenModal] = useState(false)
  const [deletingInv, setDeletingInv] = useState<Invoice>()
  const [filterGName, setFilterGName] = useState('')

  const filterDay = (numDays: number) => {

    var newDate = Date.now() + numDays * 86400000
    var newDD = new Date(newDate)
    console.info("Change filter date to %s", newDD.toISOString())
    setFromDate(newDD)
    setDeltaDays(numDays)
  }

  const handlePaginationClick = (pageNumber: number) => {
    console.log("Pagination nav bar click to page %s", pageNumber)
    var pNum = pageNumber < 0 ? 0 : pageNumber > pagination.totalPages - 1 ? pagination.totalPages - 1 : pageNumber;
    setPagination({
      ...pagination,
      pageNumber: pNum
    })
  }

  // const isCurrentlyStaying = (invoice: Invoice) => {
  //   const now = new Date();
  //   const checkInDate = new Date(invoice.checkInDate);
  //   const checkOutDate = new Date(invoice.checkOutDate);
  //   return now >= checkInDate && now <= checkOutDate;
  // };

  // const sortInvoices = (invoices: Invoice[]): Invoice[] => {
  //   return invoices.sort((a, b) => {
  //     const aCurrentlyStaying = isCurrentlyStaying(a);
  //     const bCurrentlyStaying = isCurrentlyStaying(b);

  //     if (aCurrentlyStaying && !bCurrentlyStaying) return -1;
  //     if (!aCurrentlyStaying && bCurrentlyStaying) return 1;

  //     const aCheckOutDate = new Date(a.checkOutDate).getTime();
  //     const bCheckOutDate = new Date(b.checkOutDate).getTime();

  //     return aCheckOutDate - bCheckOutDate;
  //   });
  // }

  const fetchInvoices = () => {

    var fd = formatISODate(fromDate)
    console.info("Loading invoices from date %s...", fd)

    listStayingAndComingInvoices(fd, pagination.pageNumber, pagination.pageSize)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setInvoices(data.content)
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

  useEffect(() => {
    fetchInvoices();
    props.activeMenu();

    // eslint-disable-next-line
  }, [pagination.pageNumber, fromDate]);

  const filterOpts = [
    {
      days: 0,
      label: 'Today'
    },
    {
      days: -1,
      label: 'Yesterday'
    },
    {
      days: -5,
      label: '5 days'
    },
    {
      days: -1 * new Date().getDate(),
      label: '1st'
    }]

  const pageClass = (pageNum: number) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  //================ DELETE INVOICE ==========================//
  const handleDeleteInvoice = (inv: Invoice) => {
    if (!isDeleteable(inv)) {
      console.warn("Can not delete the paid invoice")
      return
    }
    setDeletingInv(inv);
    setOpenModal(true)
  }

  const cancelDeletion = () => {
    setOpenModal(false)
    setDeletingInv(undefined)
  }

  const confirmDeletion = () => {
    try {
      if (deletingInv === undefined || deletingInv === null) {
        return;
      }
      console.warn("Delete invoice %s...", deletingInv.id)
      deleteInvoice(deletingInv)
        .then(rsp => {
          if (rsp.ok) {
            console.info("Delete invoice %s successfully", deletingInv.id)
            fetchInvoices()
          }
        })
        .catch(err => {
          console.error("Failed to delete invoice %s", deletingInv.id)
          console.log(err)
        })
    } catch (e) {
      console.error(e)
    } finally {
      setOpenModal(false)
      setDeletingInv(undefined)
    }
  }

  const isDeleteable = (inv: Invoice) => {
    if (inv.prepaied) {
      return false
    }
    if (inv.paymentMethod === null || inv.paymentMethod === undefined || inv.paymentMethod === "") {
      return true
    }
    return false
  }

  const changeFilterGName = (e: ChangeEvent<HTMLInputElement>) => {
    let fN = e.target.value
    setFilterGName(fN)
    if (fN === '') {
      fetchInvoices()
      return
    }
    let fromDate = formatISODate(new Date())

    listInvoiceByGuestName(fromDate, fN, 0, DEFAULT_PAGE_SIZE)
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setInvoices(data.content)
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

  const emptyFilteredName = () => {
    setFilterGName('')
    fetchInvoices()
  }

  return (
    <div className="h-full pt-3 relative">
      <div className="flex flex-row pb-4 px-2 space-x-4 space-y-2">
        <div className="flex flex-row items-center"
        >
          <svg
            className="w-5 h-5 text-amber-700 dark:text-white"
            aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" />
          </svg>
          <Link
            to="../invoice/new"
            relative="route"
            className="font-bold text-amber-800"
          >
            Add
          </Link>
        </div>
        <TextInput
          id="filteredName"
          placeholder="John Smith"
          type="text"
          required={true}
          value={filterGName}
          onChange={changeFilterGName}
          rightIcon={() => <HiX onClick={emptyFilteredName} />}
        />
      </div>
      <div className="flex flex-row space-x-2 px-4">
        {filterOpts.map((opt) => {
          return (<Link
            key={opt.days}
            to=""
            onClick={() => filterDay(opt.days)}
            relative="route"
            className={deltaDays === opt.days ?
              "font-mono rounded px-2 py-0.5 bg-slate-400"
              : "font-mono rounded px-2 py-0.5 bg-slate-200"}
          >
            {opt.label}
          </Link>)
        })}
      </div>
      <div>
        <Table hoverable={true}>
          <Table.Head>
            <Table.HeadCell className="pr-1">
              ChOut
            </Table.HeadCell>
            <Table.HeadCell className="px-1">
              Details
            </Table.HeadCell>
            <Table.HeadCell>
              <span className="sr-only">
                Delete
              </span>
            </Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {invoices.map((inv) => {
              return (
                <Table.Row
                  className="bg-white"
                  key={inv.id}
                >
                  <Table.Cell className="sm:px-1 pr-1 py-0.5">
                    <Moment format="DD.MM">{new Date(inv.checkOutDate)}</Moment>
                  </Table.Cell>
                  <Table.Cell className="sm:px-1 px-1 py-0.5">
                    <div className="grid grid-cols-1">
                      <div className="flex flex-row space-x-2 content-center">
                        <Link
                          to={inv.id}
                          state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                          className={isDeleteable(inv) ? "font-sans text-green-800 hover:underline dark:text-gray-100" : "font-sans text-gray-600 hover:underline dark:text-white-500"}
                        >
                          {inv.guestName}
                        </Link>
                        <div className="flex flex-row  items-center space-x-1 ">
                          <GiHouse />
                          <span className="font font-mono text-[12px]">{inv.rooms}</span>
                        </div>
                      </div>
                      <div className="flex flex-row text-sm space-x-1">
                        <div className="w-24">
                          <span>{formatVND(inv.subTotal)}</span>
                        </div>
                        <span className="font font-mono font-black w-8">{inv.prepaied ? "TT" : "TS"}</span>
                        <span className="font font-mono font-black">{inv.issuer}</span>
                      </div>
                    </div>
                  </Table.Cell>


                  <Table.Cell className="py-0.5">
                    <svg
                      className={isDeleteable(inv) ? "w-6 h-6 text-red-800 dark:text-white" : "w-6 h-6 text-gray-800 dark:text-white"}
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24" fill="none" viewBox="0 0 24 24"
                      onClick={() => handleDeleteInvoice(inv)}
                    >
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
                    </svg>

                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </div>
      <nav className="flex items-center justify-between pt-4 absolute bottom-1" aria-label="Table navigation">
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
      <Modal show={openModal} onClose={cancelDeletion}>
        <Modal.Header>Confirm</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              {deletingInv !== null && deletingInv !== undefined ? "Delete invoice of " + deletingInv.guestName + " ?" : "You need to choose the invoice to delete"}
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={confirmDeletion}>Delete</Button>
          <Button color="gray" onClick={cancelDeletion}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>


    </div >
  );
}
