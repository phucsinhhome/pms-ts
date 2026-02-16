import React, { useState, useEffect, useRef, memo } from "react";
import { TextInput, Label, Modal, Button } from "flowbite-react";
import { Chat, DEFAULT_PAGE_SIZE } from "../App";
import { HiX } from "react-icons/hi";
import { formatISODate } from "../Service/Utils";
import { Pagination } from "./ProfitReport";
import {
  MdAssignmentAdd,
  MdOutlineFamilyRestroom,
  MdOutlineMan,
} from "react-icons/md";
import { FaUmbrellaBeach } from "react-icons/fa";
import { IoMdRemoveCircle } from "react-icons/io";
import { CiEdit } from "react-icons/ci";
import { createRoom, deleteRoom, listRoom, saveRoom } from "../db/room";
import { FaBed } from "react-icons/fa6";

export type Room = {
  id?: string;
  internalName: string;
  name: string;
  status: string;
  description?: string;
  roomTypeId?: string;
  coverImageUrl?: string;
  imageUrls?: string[];
  maxAdults?: number;
  maxChildren?: number;
  amenities?: string[];
  numSingleBeds?: number;
  numDoubleBeds?: number;
  numQueenBeds?: number;
  numHammocks?: number;
  view?: string;
  cleaningTime: string;
};

const defaultRoom: Room = {
  internalName: "",
  name: "",
  status: "ACTIVE",
  cleaningTime: "PT1H",
  maxAdults: 2,
  maxChildren: 0,
  numSingleBeds: 0,
  numDoubleBeds: 1,
  numQueenBeds: 0,
  numHammocks: 2,
};

type RoomManagerProps = {
  chat: Chat;
  authorizedUserId: string | null;
  displayName: string;
  activeMenu: any;
  handleUnauthorized: any;
  hasAuthority: (auth: string) => boolean;
};

export const RoomManager = memo((props: RoomManagerProps) => {
  const [rooms, setRooms] = useState<Room[]>([]);

  const [openDelExpenseModal, setOpenDelExpenseModal] = useState(false);

  const [openEditingModal, setOpenEditingModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room>(defaultRoom);

  const deleteAuthorized = props.hasAuthority("room:delete");

  const [pagination, setPagination] = useState<Pagination>({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });

  const expMsgRef = useRef<HTMLInputElement>(null);

  const handlePaginationClick = (pageNumber: number) => {
    console.log("Pagination nav bar click to page %s", pageNumber);
    setPagination({
      ...pagination,
      pageNumber:
        pageNumber < 0
          ? 0
          : pageNumber > pagination.totalPages - 1
          ? pagination.totalPages - 1
          : pageNumber,
    });
  };

  const fetchRooms = async () => {
    try {
      let byDate = formatISODate(new Date());

      let res = await listRoom(pagination.pageNumber, pagination.pageSize);
      if (res.status === 401 || res.status === 403) {
        props.handleUnauthorized();
        return;
      }
      if (res === undefined || res.status !== 200) {
        console.warn("Invalid room response");
        return;
      }
      const data = res.data;
      console.info("Fetched %s rooms by date %s", data.size, byDate);
      let sortedExps = data.content;
      setRooms(sortedExps);
      setPagination({
        pageNumber: data.number,
        pageSize: data.size,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
      });
    } catch (e) {
      console.error("Error while fetching rooms", e);
    }
  };

  useEffect(() => {
    props.activeMenu();
    fetchRooms();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageNumber]);

  useEffect(() => {
    fetchRooms();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.chat]);

  const pageClass = (pageNum: number) => {
    var noHighlight =
      "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white";
    var highlight =
      "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white";

    return pagination.pageNumber === pageNum ? highlight : noHighlight;
  };

  //============ EXPENSE DELETION ====================//
  const deleletConfirmation = (room: Room) => {
    setEditingRoom(room);
    setOpenDelExpenseModal(true);
  };

  const cancelDelExpense = () => {
    setOpenDelExpenseModal(false);
    setEditingRoom(defaultRoom);
  };

  const confirmDelExpense = async () => {
    try {
      if (editingRoom === undefined || editingRoom === null) {
        return;
      }
      let res = await deleteRoom(editingRoom.id!);
      if (res.status === 401 || res.status === 403) {
        props.handleUnauthorized();
        return;
      }
      if (res === undefined || res.status !== 200) {
        console.warn("Invalid room deletion response");
        return;
      }
      fetchRooms();
    } catch (e) {
      console.error(e);
    } finally {
      setOpenDelExpenseModal(false);
      setEditingRoom(defaultRoom);
    }
  };

  //================= EDIT ===================//
  const editRoom = (exp: Room) => {
    setEditingRoom(exp);
    setOpenEditingModal(true);
  };

  const cancelEditing = () => {
    setEditingRoom(defaultRoom);
    setOpenEditingModal(false);
    fetchRooms();
  };

  const emptyTextInput = (fieldName: string) => {
    setEditingRoom({
      ...editingRoom,
      [fieldName]: "",
    });
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;

    setEditingRoom({
      ...editingRoom,
      [id]: value,
    });
  };

  const changeQuantity = (fieldName: string, delta: number) => {
    let currentValue = (editingRoom as any)[fieldName] ?? 0;
    setEditingRoom({
      ...editingRoom,
      [fieldName]: currentValue + delta,
    });
  };

  const processSaveExpense = async () => {
    console.info("Saving room %s...", editingRoom.id ?? "new");
    let res = null;
    if (editingRoom.id === null || editingRoom.id === undefined) {
      // New room
      res = await createRoom(editingRoom);
    } else {
      // Existing room
      res = await saveRoom(editingRoom);
    }
    if (res.status === 401 || res.status === 403) {
      props.handleUnauthorized();
      return;
    }
    if (res === undefined || res.status !== 200) {
      console.warn("Invalid room save response");
      return;
    }

    setOpenEditingModal(false);
    fetchRooms();
  };

  const handleSave = () => {
    processSaveExpense();
  };

  return (
    <>
      <div className="flex flex-row space-x-2 px-2 align-middle"></div>
      <div className="flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col divide-y">
          {rooms?.map((room) => {
            return (
              <div
                key={room.internalName}
                className="relative flex w-full flex-col space-y-1 px-1"
              >
                <div className="font text-sm text-green-600">
                  {room.internalName} - {room.name}
                </div>
                <div className="flex flex-row space-x-3 text-[10px]">
                  {/* Adult icon and count */}
                  <div className="flex items-center space-x-1">
                    <MdOutlineMan size="1em" className="text-yellow-700" />
                    <span>{room.maxAdults ?? 0}</span>
                  </div>
                  {/* Child icon and count */}
                  <div className="flex items-center space-x-1">
                    <MdOutlineFamilyRestroom
                      size="1em"
                      className="text-yellow-700"
                    />
                    <span>{room.maxChildren ?? 0}</span>
                  </div>
                  {/* Double bed icon and count */}
                  <div className="flex items-center space-x-1">
                    <FaBed size="1em" className="text-yellow-700" />
                    <span>{room.numDoubleBeds ?? 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FaUmbrellaBeach size="1em" className="text-yellow-700" />
                    <span>{room.numHammocks ?? 0}</span>
                  </div>
                </div>
                <div className="absolute right-1 top-1 flex flex-row space-x-2">
                  {deleteAuthorized ? (
                    <IoMdRemoveCircle
                      size="1.5em"
                      className="mr-2 cursor-pointer text-red-800"
                      onClick={() => deleletConfirmation(room)}
                    />
                  ) : (
                    <></>
                  )}
                  <CiEdit
                    size="1.5em"
                    className="mr-2 cursor-pointer text-green-800"
                    onClick={() => editRoom(room)}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="h-14"></div>
      </div>
      <div className="absolute bottom-1 left-1/2 flex w-11/12 -translate-x-1/2 flex-row items-center justify-center space-x-2 rounded-3xl bg-slate-300 opacity-70 shadow-sm">
        <nav
          className="flex items-center justify-between"
          aria-label="Table navigation"
        >
          <ul className="inline-flex items-center -space-x-px">
            <li
              onClick={() => handlePaginationClick(pagination.pageNumber - 1)}
              className="ml-0 block rounded-l-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <svg
                className="h-5 w-5"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </li>
            <li
              onClick={() => handlePaginationClick(0)}
              className={pageClass(0)}
            >
              1
            </li>
            <li
              hidden={
                pagination.pageNumber + 1 <= 1 ||
                pagination.pageNumber + 1 >= pagination.totalPages
              }
              aria-current="page"
              className={pageClass(pagination.pageNumber)}
            >
              {pagination.pageNumber + 1}
            </li>
            <li
              hidden={pagination.totalPages <= 1}
              onClick={() => handlePaginationClick(pagination.totalPages - 1)}
              className={pageClass(pagination.totalPages - 1)}
            >
              {pagination.totalPages}
            </li>
            <li
              onClick={() => handlePaginationClick(pagination.pageNumber + 1)}
              className="block rounded-r-lg border border-gray-300 bg-white px-3 py-2 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <svg
                className="h-5 w-5"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </li>
          </ul>
        </nav>
        <Button size="xs" color="green" onClick={() => editRoom(defaultRoom)}>
          <MdAssignmentAdd size="1.5em" className="mr-2" /> Add Room
        </Button>
      </div>
      <Modal show={openDelExpenseModal} onClose={cancelDelExpense}>
        <Modal.Header>Confirm</Modal.Header>
        <Modal.Body>
          <div>
            <span>
              {editingRoom === null
                ? ""
                : "Are you sure to delete room [" + editingRoom?.name + "]?"}
            </span>
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
        show={openEditingModal}
        size="md"
        popup={true}
        onClose={cancelEditing}
        initialFocus={expMsgRef}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="w-full space-y-2 pb-2 sm:pb-6 lg:px-8 xl:pb-8">
            <div className="flex w-full flex-col align-middle">
              <div className="flex w-3/5 items-center">
                <Label htmlFor="name" value="Room Name" />
              </div>
              <TextInput
                id="name"
                placeholder="Bungalow garden view"
                required={true}
                value={editingRoom?.name}
                onChange={handleTextChange}
                className="w-full"
                rightIcon={() => <HiX onClick={() => emptyTextInput("name")} />}
              />
            </div>
            <div className="flex w-full flex-col align-middle">
              <div className="flex w-3/5 items-center">
                <Label htmlFor="internalName" value="Internal Name" />
              </div>
              <TextInput
                id="internalName"
                placeholder="Bungalow garden view"
                required={true}
                value={editingRoom?.internalName}
                onChange={handleTextChange}
                className="w-full"
                rightIcon={() => (
                  <HiX onClick={() => emptyTextInput("internalName")} />
                )}
              />
            </div>
            <div className="flex w-full flex-row align-middle">
              <div className="flex w-3/5 items-center">
                <Label htmlFor="numAdults" value="Max Adults" />
              </div>
              <div className="relative flex w-32 items-center">
                <button
                  type="button"
                  id="decrement-button"
                  data-input-counter-decrement="quantity-input"
                  className="h-11 rounded-s-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                  onClick={() => changeQuantity("maxAdults", -1)}
                >
                  <svg
                    className="h-3 w-3 text-gray-900 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 2"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 1h16"
                    />
                  </svg>
                </button>
                <input
                  type="number"
                  id="numAdults"
                  data-input-counter
                  aria-describedby="helper-text-explanation"
                  className="block h-11 w-full border-x-0 border-gray-300 bg-gray-50 py-2.5 text-center text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  placeholder="999"
                  required
                  value={editingRoom?.maxAdults}
                  readOnly
                />
                <button
                  type="button"
                  id="increment-button"
                  data-input-counter-increment="quantity-input"
                  className="h-11 rounded-e-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                  onClick={() => changeQuantity("maxAdults", 1)}
                >
                  <svg
                    className="h-3 w-3 text-gray-900 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 18"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 1v16M1 9h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex w-full flex-row align-middle">
              <div className="flex w-3/5 items-center">
                <Label htmlFor="numChildren" value="Max Children" />
              </div>
              <div className="relative flex w-32 items-center">
                <button
                  type="button"
                  id="decrement-button"
                  data-input-counter-decrement="quantity-input"
                  className="h-11 rounded-s-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                  onClick={() => changeQuantity("maxChildren", -1)}
                >
                  <svg
                    className="h-3 w-3 text-gray-900 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 2"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 1h16"
                    />
                  </svg>
                </button>
                <input
                  type="number"
                  id="numChildren"
                  data-input-counter
                  aria-describedby="helper-text-explanation"
                  className="block h-11 w-full border-x-0 border-gray-300 bg-gray-50 py-2.5 text-center text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  placeholder="999"
                  required
                  value={editingRoom?.maxChildren}
                  readOnly
                />
                <button
                  type="button"
                  id="increment-button"
                  data-input-counter-increment="quantity-input"
                  className="h-11 rounded-e-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                  onClick={() => changeQuantity("maxChildren", 1)}
                >
                  <svg
                    className="h-3 w-3 text-gray-900 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 18"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 1v16M1 9h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex w-full flex-row align-middle">
              <div className="flex w-3/5 items-center">
                <Label htmlFor="numSingleBeds" value="Num Single Beds" />
              </div>
              <div className="relative flex w-32 items-center">
                <button
                  type="button"
                  id="decrement-button"
                  data-input-counter-decrement="quantity-input"
                  className="h-11 rounded-s-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                  onClick={() => changeQuantity("numSingleBeds", -1)}
                >
                  <svg
                    className="h-3 w-3 text-gray-900 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 2"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 1h16"
                    />
                  </svg>
                </button>
                <input
                  type="number"
                  id="numSingleBeds"
                  data-input-counter
                  aria-describedby="helper-text-explanation"
                  className="block h-11 w-full border-x-0 border-gray-300 bg-gray-50 py-2.5 text-center text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  placeholder="999"
                  required
                  value={editingRoom?.numSingleBeds}
                  readOnly
                />
                <button
                  type="button"
                  id="increment-button"
                  data-input-counter-increment="quantity-input"
                  className="h-11 rounded-e-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                  onClick={() => changeQuantity("numSingleBeds", 1)}
                >
                  <svg
                    className="h-3 w-3 text-gray-900 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 18"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 1v16M1 9h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex w-full flex-row align-middle">
              <div className="flex w-3/5 items-center">
                <Label htmlFor="numDoubleBeds" value="Num Double Beds" />
              </div>
              <div className="relative flex w-32 items-center">
                <button
                  type="button"
                  id="decrement-button"
                  data-input-counter-decrement="quantity-input"
                  className="h-11 rounded-s-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                  onClick={() => changeQuantity("numDoubleBeds", -1)}
                >
                  <svg
                    className="h-3 w-3 text-gray-900 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 2"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 1h16"
                    />
                  </svg>
                </button>
                <input
                  type="number"
                  id="numDoubleBeds"
                  data-input-counter
                  aria-describedby="helper-text-explanation"
                  className="block h-11 w-full border-x-0 border-gray-300 bg-gray-50 py-2.5 text-center text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  placeholder="999"
                  required
                  value={editingRoom?.numDoubleBeds}
                  readOnly
                />
                <button
                  type="button"
                  id="increment-button"
                  data-input-counter-increment="quantity-input"
                  className="h-11 rounded-e-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                  onClick={() => changeQuantity("numDoubleBeds", 1)}
                >
                  <svg
                    className="h-3 w-3 text-gray-900 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 18"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 1v16M1 9h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex w-full flex-row align-middle">
              <div className="flex w-3/5 items-center">
                <Label htmlFor="numQueenBeds" value="Num Queen Beds" />
              </div>
              <div className="relative flex w-32 items-center">
                <button
                  type="button"
                  id="decrement-button"
                  data-input-counter-decrement="quantity-input"
                  className="h-11 rounded-s-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                  onClick={() => changeQuantity("numQueenBeds", -1)}
                >
                  <svg
                    className="h-3 w-3 text-gray-900 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 2"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 1h16"
                    />
                  </svg>
                </button>
                <input
                  type="number"
                  id="numQueenBeds"
                  data-input-counter
                  aria-describedby="helper-text-explanation"
                  className="block h-11 w-full border-x-0 border-gray-300 bg-gray-50 py-2.5 text-center text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  placeholder="999"
                  required
                  value={editingRoom?.numQueenBeds}
                  readOnly
                />
                <button
                  type="button"
                  id="increment-button"
                  data-input-counter-increment="quantity-input"
                  className="h-11 rounded-e-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                  onClick={() => changeQuantity("numQueenBeds", 1)}
                >
                  <svg
                    className="h-3 w-3 text-gray-900 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 18"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 1v16M1 9h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex w-full flex-row align-middle">
              <div className="flex w-3/5 items-center">
                <Label htmlFor="numHammocks" value="Num Hammocks" />
              </div>
              <div className="relative flex w-32 items-center">
                <button
                  type="button"
                  id="decrement-button"
                  data-input-counter-decrement="quantity-input"
                  className="h-11 rounded-s-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                  onClick={() => changeQuantity("numHammocks", -1)}
                >
                  <svg
                    className="h-3 w-3 text-gray-900 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 2"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 1h16"
                    />
                  </svg>
                </button>
                <input
                  type="number"
                  id="numHammocks"
                  data-input-counter
                  aria-describedby="helper-text-explanation"
                  className="block h-11 w-full border-x-0 border-gray-300 bg-gray-50 py-2.5 text-center text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                  placeholder="999"
                  required
                  value={editingRoom?.numHammocks}
                  readOnly
                />
                <button
                  type="button"
                  id="increment-button"
                  data-input-counter-increment="quantity-input"
                  className="h-11 rounded-e-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700"
                  onClick={() => changeQuantity("numHammocks", 1)}
                >
                  <svg
                    className="h-3 w-3 text-gray-900 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 18 18"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 1v16M1 9h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex w-full justify-center">
              <Button onClick={handleSave} className="mx-2">
                Save
              </Button>
              <Button onClick={cancelEditing} className="mx-2">
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
});
