import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Spinner } from "flowbite-react";
import { DEFAULT_PAGE_SIZE } from "../App";
import { formatISODate, addDays } from "../Service/Utils";
import { listStayingAndComingInvoices } from "../db/invoice";
import { Pagination } from "./ProfitReport";
import { GiHouse } from "react-icons/gi";
import { IoMdList } from "react-icons/io";
import { Invoice } from "./InvoiceManager";
import { BiLogIn, BiLogOut } from "react-icons/bi";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { collectRes } from "../db/reservation_extractor";
import { Configs } from "./InvoiceEditor";
import { MdAssignmentAdd } from "react-icons/md";

type InvoiceMapProps = {
  activeMenu: any,
  handleUnauthorized(): any
}

type InvoiceWindow = {
  invoice: Invoice,
  state: 'staying' | 'tobeCheckOut' | 'tobeCheckIn' | 'outOfWindow'
}


// 2D map: each cell is either a room name or null for empty
const ROOM_MAP: (string | null)[][] = [
  ["R1", "R4"],
  ["R2", "R5"],
  ["R3", "R6"]
];

const invoiceIcons = {
  tobeCheckIn: <BiLogIn className="text-green-900 w-6" title="To be checked in" />,
  tobeCheckOut: <BiLogOut className="text-red-900 w-6" title="To be checked out" />,
  staying: <GiHouse className="text-blue-900 w-6" title="Staying" />
}

export const InvoiceMap = (props: InvoiceMapProps) => {
  const [invoices, setInvoices] = useState<InvoiceWindow[]>([])
  const [workDate, setWorkDate] = useState(new Date());
  const [pagination, setPagination] = useState<Pagination>({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0
  })
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);


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


  //================ DELETE INVOICE ==========================//

  // Arrow handlers for workDate navigation
  const handlePrevDate = () => {
    setWorkDate(prev => addDays(prev, -1));
  };
  const handleNextDate = () => {
    setWorkDate(prev => addDays(prev, 1));
  };

  // Handler to jump to today
  const handleJumpToToday = () => {
    setWorkDate(new Date());
  };

  const handleUpdateClick = async () => {
    setIsUpdating(true);
    try {
      const fd = formatISODate(workDate);
      const td = formatISODate(addDays(workDate, Configs.reservation.fetchDays));
      const rsp = await collectRes(fd, td);
      if (rsp.status === 200) {
        console.info("Reservation sync started, fetch latest invoices...")
        fetchInvoices();
      }
    }
    catch (error) {
      console.error("Failed to collect reservations: ", error);
    }
    finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-full pt-3 relative">
      <div className="flex flex-row px-2 space-x-4 pb-2 items-center">
        <Button size="md" color="green"
          onClick={() => handleUpdateClick()}>
          {isUpdating ? <Spinner aria-label="Default status example" size="1.5em" />
            : <MdAssignmentAdd size="1.5em" className="mr-2" />} Sync
        </Button>
        <Button size="md" color="success" onClick={handleJumpToToday} className="w-36" >
          Today
        </Button>
        <Link
          to="/invoice"
          relative="route"
        >
          <Button size="md" color="green">
            <IoMdList size="1.5em" className="mr-2" />List
          </Button>
        </Link>
      </div>
      <div className="flex flex-col px-2 items-center space-y-2">
        <div className="flex flex-row space-x-2 px-4 items-center">
          <Button size="xs" color="gray" onClick={handlePrevDate} className="flex items-center">
            <FaChevronLeft className="mr-1" /> Prev
          </Button>
          <span className="font-bold text-green-900 px-2">
            {workDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <Button size="xs" color="gray" onClick={handleNextDate} className="flex items-center">
            Next <FaChevronRight className="ml-1" />
          </Button>
        </div>
      </div>
      {/* Room layout grid */}
      <div
        className="grid grid-cols-2 grid-rows-3 gap-2 mt-4 p-2"
      >
        {ROOM_MAP.flatMap((row, rowIdx) =>
          row.map((roomName, colIdx) => (
            <div
              key={`cell-${rowIdx}-${colIdx}`}
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
                      <div className="flex flex-col bg-green-200 rounded px-1 py-1 shadow">
                        <div key={inv.invoice.id}
                          className=" text-green-900 text-lg font-semibold  flex items-center"
                          onClick={() => navigate(`/invoice/${inv.invoice.id}`)}
                        >
                          {inv.state in invoiceIcons ? invoiceIcons[inv.state as keyof typeof invoiceIcons] : null}
                          <span>{inv.invoice?.guestName}</span>
                        </div>
                        <div className="text-sm font-mono text-gray-400">
                          {inv.invoice.reservationCode}
                        </div>
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
