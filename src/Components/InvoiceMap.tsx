import React, { useState, useEffect, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Button, TextInput } from "flowbite-react";
import { DEFAULT_PAGE_SIZE } from "../App";
import { HiX } from "react-icons/hi";
import { formatISODate } from "../Service/Utils";
import { deleteInvoice, listInvoiceByGuestName, listStayingAndComingInvoices } from "../db/invoice";
import { optionStyle, Pagination } from "./ProfitReport";
import { GiHouse } from "react-icons/gi";
import { IoMdPersonAdd } from "react-icons/io";
import { Invoice } from "./InvoiceManager";
import { BiLogIn, BiLogOut } from "react-icons/bi";

type InvoiceMapProps = {
  activeMenu: any,
  handleUnauthorized(): any
}

type InvoiceWindow = {
  invoice: Invoice,
  state: 'staying' | 'tobeCheckOut' | 'tobeCheckIn' | 'outOfWindow'
}

const ROOM_WIDTH = 250;
const ROOM_HEIGHT = 120;

// 2D map: each cell is either a room name or null for empty
const ROOM_MAP: (string | null)[][] = [
  ["R1"],
  ["R2"],
  ["R3"],
  ["R4"],
  ["R5"],
  ["R6"]
];

const invoiceIcons = {
  tobeCheckIn: <BiLogIn className="text-green-900" title="To be checked in" />,
  tobeCheckOut: <BiLogOut className="text-red-900" title="To be checked out" />,
  staying: <GiHouse className="text-blue-900" title="Staying" />
}

export const InvoiceMap = (props: InvoiceMapProps) => {
  const [invoices, setInvoices] = useState<InvoiceWindow[]>([])
  const [workDate, setWorkDate] = useState(new Date());
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
    setWorkDate(newDD)
    setDeltaDays(numDays)
  }

  const toWindow = (inv: Invoice): InvoiceWindow => {
    const today = formatISODate(workDate);
    const checkInDate = formatISODate(new Date(inv.checkInDate));
    const checkOutDate = formatISODate(new Date(inv.checkOutDate));
    if (checkInDate === today) {
      return { invoice: inv, state: 'tobeCheckIn' }
    }
    if (checkOutDate === today) {
      return { invoice: inv, state: 'tobeCheckOut' }
    }
    if (checkInDate < today && checkOutDate > today) {
      return { invoice: inv, state: 'staying' }
    }
    return { invoice: inv, state: 'outOfWindow' }
  }

  const fetchInvoices = async () => {
    const fd = formatISODate(workDate);
    const rsp = await listStayingAndComingInvoices(fd, pagination.pageNumber, pagination.pageSize);
    if (rsp.status === 401 || rsp.status === 403) {
      props.handleUnauthorized()
      return
    }
    if (rsp.status === 200) {
      const data = rsp.data;
      setInvoices(data.content.map(toWindow).filter((invW: InvoiceWindow) => invW.state !== 'outOfWindow'));
      if (data.totalPages !== pagination.totalPages) {
        var page = {
          pageNumber: data.number,
          pageSize: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages
        }
        setPagination(page);
      }
    } else {
      setInvoices([]);
    }
  }

  useEffect(() => {
    fetchInvoices();
    props.activeMenu();
    // eslint-disable-next-line
  }, [pagination.pageNumber, workDate]);

  // Filter invoices for each room: not checked out or check-in today
  const getRoomGuests = (roomName: string) => {
    return invoices.filter(inv => {
      const roomList = Array.isArray(inv.invoice.rooms) ? inv.invoice.rooms : [inv.invoice.rooms];
      return roomList.includes(roomName);
    });
  };

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

  const confirmDeletion = async () => {
    try {
      if (deletingInv === undefined || deletingInv === null) {
        return;
      }
      console.warn("Delete invoice %s...", deletingInv.id)
      const rsp = await deleteInvoice(deletingInv.id)

      if (rsp.status === 200) {
        console.info("Delete invoice %s successfully", deletingInv.id)
        fetchInvoices()
      } else {
        console.error("Failed to delete invoice %s: status %s", deletingInv.id, rsp.status)
      }
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
        // Axios: check status code and update state
        if (rsp.status === 200) {
          const data = rsp.data;
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
        } else {
          setInvoices([]);
        }
      })
      .catch(() =>
        setInvoices([])
      )
  }

  const emptyFilteredName = () => {
    setFilterGName('')
    fetchInvoices()
  }

  function handlePaginationClick(arg0: number): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="h-full pt-3 relative">
      <div className="flex flex-row px-2 space-x-4 pb-2 items-center">
        <Button size="xs" color="green">
          <IoMdPersonAdd size="1.5em" className="mr-2" />
          <Link
            to="../invoice/new"
            relative="route"
          >
            Add
          </Link>
        </Button>
        <TextInput
          sizing="xs"
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
            className={optionStyle(deltaDays === opt.days)}
          >
            {opt.label}
          </Link>)
        })}
      </div>
      {/* Room layout grid */}
      <div
        className="mt-4"
        style={{
          width: ROOM_MAP[0].length * ROOM_WIDTH,
          height: ROOM_MAP.length * ROOM_HEIGHT,
          display: "grid",
          gridTemplateColumns: `repeat(${ROOM_MAP[0].length}, ${ROOM_WIDTH}px)`,
          gridTemplateRows: `repeat(${ROOM_MAP.length}, ${ROOM_HEIGHT}px)`,
          gap: "8px"
        }}
      >
        {ROOM_MAP.flatMap((row, rowIdx) =>
          row.map((roomName, colIdx) => (
            <div
              key={`cell-${rowIdx}-${colIdx}`}
              style={{
                width: ROOM_WIDTH,
                height: ROOM_HEIGHT,
                position: "relative",
                visibility: roomName ? "visible" : "hidden"
              }}
              className={roomName
                ? "border border-green-700 rounded-lg bg-green-50 flex flex-col items-center p-2"
                : ""}
            >
              {roomName && (
                <>
                  <div className="font-bold text-green-900 mb-1 flex items-center">
                    <GiHouse className="mr-1" /> {roomName}
                  </div>
                  <div className="flex flex-col space-y-2 w-full">
                    {getRoomGuests(roomName).map(inv => (
                      <div key={inv.invoice.id}
                        className="bg-green-200 rounded px-1 py-1 text-green-900 text-md font-semibold shadow flex items-center">
                        {inv.state in invoiceIcons ? invoiceIcons[inv.state as keyof typeof invoiceIcons] : null}
                        <span>{inv.invoice?.guestName}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
