import { useState, useEffect } from "react";
import { listLatestReservations } from "../../db/reservation";
import { Link } from "react-router-dom";
import { Table } from "flowbite-react";
import Moment from "react-moment";
import { Configs, internalRooms } from "../Invoice/EditInvoice";
import { addDays, formatISODate } from "../../Service/Utils";
import { DEFAULT_PAGE_SIZE } from "../../App";
import { type } from "os";

export type Reservation = {
  id: string,
  code: string,
  guestName: string,
  country: string,
  channel: string,
  numOfGuest: number,
  canceled: false,
  checkInDate: string,
  checkOutDate: string,
  rooms: [],
  guestIds: [],
  guestPhotos: []
}

export function ReservationManager() {
  const [reservations, setReservations] = useState<Reservation[]>([])

  const [fromDate, setFromDate] = useState(new Date());
  const [deltaDays, setDeltaDays] = useState(0)

  const [pagination, setPagination] = useState({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 200,
    totalPages: 20
  })

  const filterDay = (numDays) => {
    var newDD = addDays(new Date(), numDays)
    console.info("Change filter date to %s", newDD.toISOString())
    setFromDate(newDD)
    setDeltaDays(numDays)
    fetchReservations(newDD, pagination.pageNumber, pagination.pageSize)
  }

  const handlePaginationClick = (pageNumber) => {
    console.log("Pagination nav bar click to page %s", pageNumber)
    var pNum = pageNumber < 0 ? 0 : pageNumber > pagination.totalPages - 1 ? pagination.totalPages - 1 : pageNumber;
    var pSize = pagination.pageSize
    fetchReservations(fromDate, pNum, pSize)
  }

  const fetchReservations = (fromDate, pageNumber, pageSize) => {

    var toDate = addDays(fromDate, Configs.reservation.fetchDays)
    var fd = formatISODate(fromDate)
    var td = formatISODate(toDate)
    console.info("Loading reservations from date [%s] to [%s]...", fd, td)

    listLatestReservations(fd, td, pageNumber, pageSize)
      .then(data => {
        setReservations(data.content)
        var page = {
          pageNumber: data.number,
          pageSize: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages
        }
        setPagination(page)
      })
  }

  useEffect(() => {
    fetchReservations(new Date(), 0, DEFAULT_PAGE_SIZE);
  }, []);

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
      label: 'Last 5 days'
    },
    {
      days: -1 * new Date().getDate(),
      label: 'From 1st'
    }]
  const filterClass = (days) => {
    var classNamePattern = "font-bold text-amber-800 rounded px-2 py-1"
    return classNamePattern + " " + (deltaDays === days ? "bg-slate-400" : "bg-slate-200");
  }

  const pageClass = (pageNum) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }


  return (
    <div className="h-full pt-3">
      <div className="flex flex-wrap pb-4 px-2 space-x-4 space-y-2">
        <div className="flex flex-row items-center mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 text-amber-700 dark:text-white"
          >
            <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
          </svg>
          <Link
            onClick={() => fetchReservations(new Date(), 0, 10)}
            className="font-bold text-amber-800"
          >
            Update
          </Link>
        </div>
      </div>
      <div className="flex flex-row space-x-4 px-4">
        {filterOpts.map((opt) => {
          return (<Link
            key={opt.days}
            onClick={() => filterDay(opt.days)}
            relative="route"
            className={filterClass(opt.days)}
          >
            {opt.label}
          </Link>)
        })}
      </div>
      <div className="h-3/5 max-h-fit overflow-hidden">
        <Table hoverable={true}>
          <Table.Head>
            <Table.HeadCell className="pr-1">
              ChIn
            </Table.HeadCell>
            <Table.HeadCell className="px-1">
              Details
            </Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {reservations.map((res) => {
              return (
                <Table.Row
                  className="bg-white"
                  key={res.id}
                >
                  <Table.Cell className="sm:px-1 pr-1 py-0.5">
                    <Moment format="DD.MM">{new Date(res.checkInDate)}</Moment>
                  </Table.Cell>
                  <Table.Cell className="sm:px-1 px-1 py-0.5">
                    <div className="grid grid-cols-1">
                      <Link
                        state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                        className={!res.canceled ? "font-medium text-blue-600 hover:underline dark:text-blue-500" : "font-medium text-gray-600 hover:underline dark:text-white-500"}
                      >
                        {res.guestName}
                      </Link>
                      <div className="flex flex-row text-sm space-x-1">
                        <div className="w-28">
                          <span>{res.code}</span>
                        </div>
                        <span className="font font-mono font-black w-8">{res.canceled ? "CAN" : "NEW"}</span>
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
      <nav className="flex items-center justify-between pt-4" aria-label="Table navigation">
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">Showing <span className="font-semibold text-gray-900 dark:text-white">{pagination.pageSize * pagination.pageNumber + 1}-{pagination.pageSize * pagination.pageNumber + pagination.pageSize}</span> of <span className="font-semibold text-gray-900 dark:text-white">{pagination.totalElements}</span></span>
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
    </div >
  );
}
