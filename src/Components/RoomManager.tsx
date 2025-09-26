import React, { useState, useEffect, useMemo } from "react";
import { listLatestReservations } from "../db/reservation";
import { Button, Spinner } from "flowbite-react";
import { addDays, formatISODate } from "../Service/Utils";
import { DEFAULT_PAGE_SIZE } from "../App";
import { optionStyle, Pagination } from "./ProfitReport";
import { collectRes } from "../db/reservation_extractor";
import { MdAssignmentAdd } from "react-icons/md";
import { Reservation } from "./ReservationManager";

// List of room names
const ROOM_NAMES = ["R1", "R2", "R3", "R4", "R5", "R6"];

type RoomManagerProps = {
  activeMenu: any,
  handleUnauthorized: any
}

export function RoomManager(props: RoomManagerProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  // Start from yesterday
  const [fromDate, setFromDate] = useState(addDays(new Date(), -1));
  const [deltaDays, setDeltaDays] = useState(-1)
  const [pagination, setPagination] = useState<Pagination>({
    pageNumber: 0,
    pageSize: 50,
    totalElements: 200,
    totalPages: 20
  })
  const [isUpdating, setIsUpdating] = useState(false);

  // Number of days to show in columns
  const NUM_DAYS = 10;

  // Generate date columns starting from yesterday
  const dateColumns = useMemo(() => {
    const cols: Date[] = [];
    for (let i = 0; i < NUM_DAYS; i++) {
      cols.push(addDays(fromDate, i));
    }
    return cols;
  }, [fromDate]);

  // Map reservations to room and date
  const reservationMap = useMemo(() => {
    // room -> date string -> reservation[]
    const map: Record<string, Record<string, Reservation[]>> = {};
    ROOM_NAMES.forEach(room => {
      map[room] = {};
      dateColumns.forEach(date => map[room][formatISODate(date)] = []);
    });
    reservations.forEach(res => {
      if (!res.rooms) return;
      res.rooms.forEach(roomObj => {
        const roomName = roomObj.internalRoomName || roomObj.roomName;
        if (!ROOM_NAMES.includes(roomName)) return;
        let start = new Date(res.checkInDate);
        let end = new Date(res.checkOutDate);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          const key = formatISODate(d);
          if (map[roomName][key]) {
            map[roomName][key].push(res);
          }
        }
      });
    });
    return map;
  }, [reservations, dateColumns]);

  const filterDay = (numDays: number) => {
    var newDD = addDays(new Date(), numDays)
    setFromDate(newDD)
    setDeltaDays(numDays)
    fetchReservations(newDD, pagination.pageNumber, pagination.pageSize)
  }

  const fetchReservations = async (fromDate: Date, pageNumber: number, pageSize: number) => {
    var toDate = addDays(fromDate, NUM_DAYS)
    var fd = formatISODate(fromDate)
    var td = formatISODate(toDate)
    const rsp = await listLatestReservations(fd, td, pageNumber, pageSize)
    if (rsp.status === 401 || rsp.status === 403) {
      props.handleUnauthorized();
      return
    }
    if (rsp.status === 200) {
      const data = rsp.data;
      setReservations(data.content)
      var page = {
        pageNumber: data.number,
        pageSize: data.size,
        totalElements: data.totalElements,
        totalPages: data.totalPages
      }
      setPagination(page)
    } else {
      setReservations([])
    }
  }

  useEffect(() => {
    fetchReservations(addDays(new Date(), -1), 0, Number(DEFAULT_PAGE_SIZE));
    props.activeMenu()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  const handleUpdateClick = async () => {
    setIsUpdating(true);
    try {
      const fd = formatISODate(new Date());
      const td = formatISODate(addDays(new Date(), NUM_DAYS));
      await collectRes(fd, td);
      setTimeout(() => {
        fetchReservations(addDays(new Date(), -1), 0, pagination.pageSize);
      }, 2000);
    }
    catch (error) {
      console.error("Failed to collect reservations: ", error);
    }
    finally {
      setIsUpdating(false);
    }
  };

  // Table view with sticky room names
  return (
    <div className="h-full pt-3 relative bg-green-50">
      <div className="flex flex-wrap pb-4 px-2 space-x-4 space-y-2">
        <div className="flex flex-row items-center mb-2">
          <Button size="xs" color="green" onClick={handleUpdateClick}>
            {isUpdating ? <Spinner aria-label="Default status example" size="1.5em" />
              : <MdAssignmentAdd size="1.5em" className="mr-2" />} Sync Reservation
          </Button>
        </div>
      </div>
      <div className="flex flex-row space-x-2 px-4">
        {[
          { days: 0, label: 'Today' },
          { days: -1, label: 'Yesterday' },
          { days: -5, label: '5 days' },
          { days: -1 * new Date().getDate(), label: '1st' }
        ].map((opt, idx) => (
          <Button
            key={idx}
            size="xs"
            color={deltaDays === opt.days ? "success" : "gray"}
            onClick={() => filterDay(opt.days)}
            className={optionStyle(deltaDays === opt.days)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      <div className="overflow-x-auto mt-4">
        <table className="min-w-max border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-green-100 text-green-900 px-2 py-2 border border-green-200"></th>
              {dateColumns.map(date => (
                <th key={date.toISOString()} className="bg-green-50 text-green-900 px-2 py-2 border border-green-200 whitespace-nowrap">
                  {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROOM_NAMES.map(room => (
              <tr key={room}>
                <td className="sticky left-0 z-10 bg-green-100 text-green-900 px-2 py-2 border border-green-200 font-bold">{room}</td>
                {dateColumns.map(date => {
                  const key = formatISODate(date);
                  const resList = reservationMap[room][key];
                  return (
                    <td key={key} className="py-1 border border-green-100 min-w-[120px]">
                      {resList && resList.length > 0 ? (
                        resList.map(res => {
                          const firstDate = formatISODate(date) === formatISODate(new Date(res.checkInDate));
                          return (
                            res.canceled ? <></> :
                              <div key={res.id} className={`flex flex-col bg-green-200 h-9 py-0.5 mb-1 text-xs shadow ${firstDate ? 'border-l-4 border-green-600 ml-2 pl-1' : ''} rounded`}>
                                {firstDate ?
                                  <span className="text-green-900 font-bold">{res.guestName}</span>
                                  : <span className="text-green-900 font-bold">_</span>
                                }
                                <span className="font-mono text-gray-400">{res.code}</span>
                              </div>
                          )
                        })
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
