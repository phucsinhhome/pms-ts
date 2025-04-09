import React, { useState, useEffect, ChangeEvent } from "react";
import { formatVND } from "../Service/Utils";
import { Chat, DEFAULT_PAGE_SIZE } from "../App";
import { Button, Label, Modal, TextInput } from "flowbite-react";
import { HiMail, HiX } from "react-icons/hi";
import { GiCoinflip, GiMeal } from "react-icons/gi";
import { MdAssignmentAdd } from "react-icons/md";
import { IoMdRemoveCircle } from "react-icons/io";
import { CiEdit } from "react-icons/ci";
import { listTour } from "../db/tour";

export const TourStatus = {
  CREATED: 'text-orange-400',
  CONFIRMED: 'text-green-700',
  REJECTED: 'text-red-700',
  TAKEN_PLACE: 'text-gray-700',
  PAID: 'text-gray-700'
}

export type TourGroup = {
  invoiceId: string,
  numOfCounted: number,
  numOfAdult: number,
  numOfKid: number,
  confirmedAt: string
}
export type TourSlot = {
  id: string,
  startTime: string,
  endTime: string
} | undefined

export type Tour = {
  tourId: string,
  name: string,
  localeName: string,
  featureImgUrl: string,
  details: string,
  detailUrl: string,
  maxGroup: number,
  displayOffset: number,
  subTotal: number,
  slots: TourSlot[],
  prices: number[],
  numKidsAsAdult: number
}

type TourManagerProps = {
  chat: Chat,
  authorizedUserId: string | null,
  displayName: string,
  activeMenu: any
}

export const TourManager = (props: TourManagerProps) => {
  const [tours, setTours] = useState<Tour[]>([])

  const [eTour, setETour] = useState<Tour>()
  const [showTourDetail, setShowTourDetail] = useState(false)

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

  const pageClass = (pageNum: number) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  useEffect(() => {
    fetchTours()
    props.activeMenu()
    // eslint-disable-next-line
  }, [pagination.pageNumber]);

  useEffect(() => {
    if (showTourDetail) {
      return
    }
    fetchTours()
    // eslint-disable-next-line
  }, [showTourDetail]);


  const fetchTours = () => {

    listTour()
      .then(rsp => {
        if (rsp.ok) {
          rsp.json()
            .then(data => {
              setTours(data.content)
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

  const addTour = () => {
  }

  const removeTour = (tour: Tour) => {
    console.log(`Remove tour ${tour.tourId}`)
  }

  const editTour = (tour: Tour) => {
    console.log(`Edit tour ${tour.tourId}`)
  }

  function hideTourDetail(): void {
    setShowTourDetail(false);
    setETour(undefined);
  }

  function changeLocaleName(event: ChangeEvent<HTMLInputElement>): void {
    if (eTour) {
      setETour({
        ...eTour,
        localeName: event.target.value
      });
    }
  }

  function emptyLocaleName(event: React.MouseEvent<SVGElement>): void {
    if (eTour) {
      setETour({
        ...eTour,
        localeName: ""
      });
    }
  }

  return (
    <div className="h-full pt-3 space-y-3 relative">
      <div className="flex flex-row items-center px-2 space-x-3">
        <Button size="xs" color="green" onClick={addTour}>
          <MdAssignmentAdd size="1.5em" className="mr-2" /> Add
        </Button>
      </div>
      <div className="flex flex-col px-2 overflow-hidden space-y-1.5 divide-y">
        {tours.map((tour) => {
          return (
            <div
              className="flex flex-col py-1 relative"
              key={tour.tourId}
            >
              <div className="flex flex-row text-sm">
                <span
                  className="font-sans text-green-800 hover:underline overflow-hidden"
                >
                  {tour.name}
                </span>
              </div>
              <div className="flex flex-row text-sm space-x-3">
                <div className="flex flex-row items-center rounded-sm w-16">
                  <GiCoinflip />
                  <span className="font font-mono text-gray-500 text-[12px]">{tour.maxGroup}</span>
                </div>
              </div>
              <div className="flex flex-row space-x-2 absolute right-1 top-2">
                <IoMdRemoveCircle size="1.5em" className="mr-2 text-red-800"
                  onClick={() => removeTour(tour)}
                />
                <CiEdit size="1.5em" className="mr-2 text-green-800"
                  onClick={() => editTour(tour)}
                />
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
        show={showTourDetail}
        popup={true}
        onClose={hideTourDetail}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="flex flex-col space-y-2 pb-2">
            <div className="flex flex-row w-full align-middle space-x-4">
              <Label
                value={eTour?.name}
              />
              <Label className="font font-mono text-sm text-amber-800"
                value={eTour ? formatVND(eTour.subTotal) : ''} />
            </div>

            <div className="flex flex-col w-full align-middle">
              <div className="flex items-center">
                <Label
                  htmlFor="localeName"
                  value="Locale Name"
                />
              </div>
              <TextInput
                id="localeName"
                placeholder="Locale name of the invoice"
                type="text"
                required={true}
                value={eTour?.localeName}
                onChange={changeLocaleName}
                rightIcon={() => <HiX onClick={emptyLocaleName} />}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex flex-col overflow-hidden space-y-1.5">
            {eTour?.slots.map((slot) => {
              return (
                <div
                  className="flex flex-row items-center border border-gray-300 shadow-xl pl-2 rounded-md bg-white dark:bg-slate-500 "
                  key={slot?.id}
                >
                  <div className="w-full">
                    <div className="grid grid-cols-1">
                      <div className="flex flex-row">
                        <span
                          className="font-medium text-green-800 hover:underline dark:text-blue-500 overflow-hidden"
                        >
                          {slot?.startTime}
                        </span>
                      </div>
                      <div className="flex flex-row text-sm space-x-3">
                        <div className="flex flex-row items-center rounded-sm">
                          <HiMail />
                          <span className="font font-mono text-gray-500 text-[12px]">{slot?.startTime}</span>
                        </div>
                        <div className="flex flex-row items-center rounded-sm">
                          <GiMeal />
                          <span className="font font-mono text-gray-500 text-[12px]">{slot?.endTime}</span>
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
                    // onClick={() => editItem(slot as EInvoiceItem)}
                    >
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="pt-3 text-center">
            <span className="font italic text-green-800">{ }</span>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center">
        </Modal.Footer>
      </Modal>
    </div >
  );
}
