import React, { useState, useEffect, useRef, ChangeEvent, memo } from "react";
import { TextInput, Label, Spinner, Modal, Button } from "flowbite-react";
import { listExpenseByDate } from "../db/expense";
import { Chat, DEFAULT_PAGE_SIZE } from "../App";
import { HiUserCircle, HiX } from "react-icons/hi";
import { formatISODate } from "../Service/Utils";
import { PiBrainThin } from "react-icons/pi";
import { listExpenseByExpenserAndDate } from "../db/expense";
import { Pagination } from "./ProfitReport";
import { MdAssignmentAdd, MdOutlineFamilyRestroom } from "react-icons/md";
import { FaUmbrellaBeach } from "react-icons/fa";
import { IoMdRemoveCircle } from "react-icons/io";
import { CiEdit } from "react-icons/ci";
import { UserInfo } from "../db/users";

export type Room = {
  id: string,
  internalRoomName: string,
  name: string,
  status: string,
  description?: string,
  roomTypeId?: string,
  coverImageUrl?: string,
  imageUrls?: string[],
  maxAdults?: number,
  maxChildren?: number,
  amenities?: string[],
  numSingleBeds?: number,
  numDoubleBeds?: number,
  numQueenBeds?: number,
  numHammocks?: number,
  view?: string,
  cleaningTime: string
}


type RoomManagerProps = {
  chat: Chat,
  authorizedUserId: string | null,
  displayName: string,
  activeMenu: any,
  handleUnauthorized: any,
  hasAuthority: (auth: string) => boolean
}

export const RoomManager = memo((props: RoomManagerProps) => {

  const [rooms, setRooms] = useState<Room[]>([]);
  const [generatingExp, setGeneratingExp] = useState(false);
  const [classifyingExp, setClassifyingExp] = useState(false);

  const [openDelExpenseModal, setOpenDelExpenseModal] = useState(false)
  const [deletingRoom, setDeletingRoom] = useState<Room>()

  const [openEditingExpenseModal, setOpenEditingRoomModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  const [openUsersModal, setOpenUsersModal] = useState(false)
  const [users, setUsers] = useState<UserInfo[]>([])

  const isAssignable = props.hasAuthority('expense:assign')

  const [pagination, setPagination] = useState<Pagination>({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0
  })

  const expMsgRef = useRef<HTMLInputElement>(null)

  const handlePaginationClick = (pageNumber: number) => {
    console.log("Pagination nav bar click to page %s", pageNumber)
    setPagination({
      ...pagination,
      pageNumber: pageNumber < 0 ? 0 : pageNumber > pagination.totalPages - 1 ? pagination.totalPages - 1 : pageNumber
    })
  }

  const fetchExpenses = async () => {
    try {
      let byDate = formatISODate(new Date())

      let res;
      if (isAssignable) {
        res = await listExpenseByDate(byDate, pagination.pageNumber, pagination.pageSize);
      } else {
        res = await listExpenseByExpenserAndDate(props.chat.username, byDate, pagination.pageNumber, pagination.pageSize);
      }
      if (res.status === 401 || res.status === 403) {
        props.handleUnauthorized()
        return
      }
      if (res === undefined || res.status !== 200) {
        console.warn("Invalid expense response")
        return
      }
      const data = res.data;
      console.info("Fetched %s expenses by date %s", data.size, byDate)
      let sortedExps = data.content
      setRooms(sortedExps)
      setPagination({
        pageNumber: data.number,
        pageSize: data.size,
        totalElements: data.totalElements,
        totalPages: data.totalPages
      })
    } catch (e) {
      console.error("Error while fetching expenses", e)
      if (e instanceof Error) {
        alert(e.message)
      }
    }
  }

  useEffect(() => {
    props.activeMenu()
    fetchExpenses()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageNumber]);

  useEffect(() => {
    fetchExpenses()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.chat]);

  const pageClass = (pageNum: number) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  const handleDeleteExpense = (exp: Room) => {
  }

  //============ EXPENSE DELETION ====================//
  const askForDelExpenseConfirmation = (exp: Room) => {
    setDeletingRoom(exp);
    setOpenDelExpenseModal(true)
  }

  const cancelDelExpense = () => {
    setOpenDelExpenseModal(false)
    setDeletingRoom(undefined)
  }

  const confirmDelExpense = () => {
    try {
      if (deletingRoom === undefined || deletingRoom === null) {
        return;
      }
      handleDeleteExpense(deletingRoom)
    } catch (e) {
      console.error(e)
    } finally {
      setOpenDelExpenseModal(false)
      setDeletingRoom(undefined)
    }

  }

  //================= EDIT ===================//
  const editRoom = (exp: Room | null) => {
    setEditingRoom(exp)
    setOpenEditingRoomModal(true)
  }

  const cancelEditingExpense = () => {
    setEditingRoom(null)
    setOpenEditingRoomModal(false)
    fetchExpenses()
  }

  const changeItemMessage = (e: ChangeEvent<HTMLInputElement>) => {
    let iMsg = e.target.value
  }

  const changeItemName = (e: ChangeEvent<HTMLInputElement>) => {
    let iName = e.target.value
  }

  const emptyItemName = () => {
  }

  const changeService = (e: ChangeEvent<HTMLInputElement>) => {
    let iName = e.target.value
  }

  const blurItemName = async () => {
  }

  const changeUnitPrice = (e: ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value
  }

  const changeQuantity = (delta: number) => {
    
  }

  const generatePopupExpense = async () => {
    
  }

  const generateExpense = async (msg: string) => {
  }

  const processSaveExpense = () => {
  }

  const handleSaveAndCompleteExpense = () => {
  }

  const handleSaveAndContinueExpense = () => {
  }

  const chooseExpenser = async (exp: Room) => {
  }

  const cancelSelectUser = () => {
    setOpenUsersModal(false)
  }

  const changeIssuer = async (user: UserInfo) => {
  }

  return (
    <div className="h-full pt-3 relative">
      <div className="flex flex-row px-2 space-x-2 align-middle">
        <Button size="xs" color="green" onClick={() => editRoom(null)}>
          <MdAssignmentAdd size="1.5em" className="mr-2" /> Add Room
        </Button>
      </div>
      <div className="flex flex-col px-2 pt-2 space-y-1.5 divide-y">
        {rooms?.map((room) => {
          return (
            <div key={room.id} className="flex flex-col w-full px-1 space-y-1 relative">
              <div
                className="font text-sm text-green-600"
              >
                {room.internalRoomName} - {room.name}
              </div>
              <div className="flex flex-row text-[10px] space-x-1">
                {/* Adult icon and count */}
                <div className="flex items-center space-x-0.5">
                  <HiUserCircle size="1em" className="text-blue-700" />
                  <span>{room.maxAdults ?? 0}</span>
                </div>
                {/* Child icon and count */}
                <div className="flex items-center space-x-0.5">
                  <MdOutlineFamilyRestroom size="1em" className="text-yellow-700" />
                  <span>{room.maxChildren ?? 0}</span>
                </div>
                {/* Double bed icon and count */}
                <div className="flex items-center space-x-0.5">
                  <FaUmbrellaBeach size="1em" className="text-red-700" />
                  <span>{room.numDoubleBeds ?? 0}</span>
                </div>
              </div>
              <div className="flex flex-row space-x-2 absolute right-1 top-2">
                <IoMdRemoveCircle size="1.5em" className="mr-2 text-red-800 cursor-pointer"
                  onClick={() => askForDelExpenseConfirmation(room)}
                />
                {isAssignable ? <HiUserCircle size="1.5em" className="mr-2 text-blue-800 cursor-pointer"
                  onClick={() => chooseExpenser(room)}
                /> : <></>}
                <CiEdit size="1.5em" className="mr-2 text-green-800 cursor-pointer"
                  onClick={() => editRoom(room)}
                />
              </div>
            </div>
          )
        })}
      </div>

      <nav className="flex items-center justify-between pt-4 absolute bottom-1" aria-label="Table navigation">
        <ul className="inline-flex items-center -space-x-px">
          <li onClick={() => handlePaginationClick(pagination.pageNumber - 1)} className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          </li>
          <li onClick={() => handlePaginationClick(0)} className={pageClass(0)}>
            1
          </li>
          <li hidden={pagination.pageNumber + 1 <= 1 || pagination.pageNumber + 1 >= pagination.totalPages}
            aria-current="page"
            className={pageClass(pagination.pageNumber)}>
            {pagination.pageNumber + 1}
          </li>
          <li hidden={pagination.totalPages <= 1}
            onClick={() => handlePaginationClick(pagination.totalPages - 1)}
            className={pageClass(pagination.totalPages - 1)}>
            {pagination.totalPages}
          </li>
          <li onClick={() => handlePaginationClick(pagination.pageNumber + 1)} className="block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
          </li>
        </ul>
      </nav>


      <Modal show={openDelExpenseModal} onClose={cancelDelExpense}>
        <Modal.Header>Confirm</Modal.Header>
        <Modal.Body>
          <div>
            <span>{deletingRoom === null ? "" : "Are you sure to delete [" + deletingRoom?.name + "]?"}</span>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={confirmDelExpense}>Delete</Button>
          <Button color="gray" onClick={cancelDelExpense}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={openEditingExpenseModal}
        size="md"
        popup={true}
        onClose={cancelEditingExpense}
        initialFocus={expMsgRef}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="space-y-6 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
            <div className="flex flex-col w-full">
              <TextInput
                id="itemMsg"
                placeholder="3 ổ bánh mì 6k"
                required={true}
                value={editingRoom?.name}
                onChange={changeItemMessage}
                className="w-full"
                rightIcon={() => generatingExp ?
                  <Spinner aria-label="Default status example"
                    className="w-14 h-10"
                  />
                  : <PiBrainThin
                    onClick={() => generatePopupExpense()}
                    className="pointer-events-auto cursor-pointer w-14 h-10"
                  />
                }
                ref={expMsgRef}
              />
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="itemName"
                  value="Item Name"
                />
              </div>
              <TextInput
                id="itemName"
                placeholder="Bánh mì"
                required={true}
                value={editingRoom?.name}
                onChange={changeItemName}
                onBlur={blurItemName}
                className="w-full"
                rightIcon={() => <HiX onClick={emptyItemName} />}
              />
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="numAdults"
                  value="Max Adults"
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
                  id="numAdults"
                  data-input-counter aria-describedby="helper-text-explanation"
                  className="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="999"
                  required
                  value={editingRoom?.maxAdults}
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
                  htmlFor="numChildren"
                  value="Max Children"
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
                  id="numChildren"
                  data-input-counter aria-describedby="helper-text-explanation"
                  className="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="999"
                  required
                  value={editingRoom?.maxChildren}
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
                  htmlFor="numSingleBeds"
                  value="Num Single Beds"
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
                  id="numSingleBeds"
                  data-input-counter aria-describedby="helper-text-explanation"
                  className="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="999"
                  required
                  value={editingRoom?.numSingleBeds}
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
                  htmlFor="numDoubleBeds"
                  value="Num Double Beds"
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
                  id="numDoubleBeds"
                  data-input-counter aria-describedby="helper-text-explanation"
                  className="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="999"
                  required
                  value={editingRoom?.numDoubleBeds}
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
                  htmlFor="numQueenBeds"
                  value="Num Queen Beds"
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
                  id="numQueenBeds"
                  data-input-counter aria-describedby="helper-text-explanation"
                  className="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="999"
                  required
                  value={editingRoom?.numQueenBeds}
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
                  htmlFor="numHammocks"
                  value="Num Hammocks"
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
                  id="numHammocks"
                  data-input-counter aria-describedby="helper-text-explanation"
                  className="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="999"
                  required
                  value={editingRoom?.numHammocks}
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
            
            <div className="w-full flex justify-center">
              <Button onClick={handleSaveAndCompleteExpense} className="mx-2">
                Save
              </Button>
              <Button onClick={cancelEditingExpense} className="mx-2">
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={openUsersModal}
        onClose={cancelSelectUser}
        popup
        dismissible
      >
        <Modal.Header></Modal.Header>
        <Modal.Body>
          <div className="flex flex-row items-center gap-2 space-x-2 w-full ">
            {
              users?.map(user => {
                return (
                  <div
                    key={user.username}
                    className="flex flex-col border-spacing-1 shadow-sm hover:shadow-lg rounded-lg items-center "
                    onClick={() => changeIssuer(user)}
                  >
                    <HiUserCircle />
                    <span className="text text-center">{user.lastName ? user.firstName + " " + user.lastName : user.firstName}</span>
                  </div>
                )
              })
            }
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button color="gray" onClick={cancelSelectUser}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
})
