import React, { useState, useEffect, useRef, memo } from "react";
import { TextInput, Label, Modal, Button, Datepicker, Checkbox } from "flowbite-react";
import { Chat, DEFAULT_PAGE_SIZE } from "../App";
import { HiX } from "react-icons/hi";
import { addDays, formatISODate, formatISODateTime, formatISOHourMinute } from "../Service/Utils";
import { Pagination } from "./ProfitReport";
import {
  MdAssignmentAdd,
  MdOutlineFamilyRestroom,
  MdOutlineMan,
} from "react-icons/md";
import { FaUmbrellaBeach } from "react-icons/fa";
import { IoMdRemoveCircle } from "react-icons/io";
import { CiEdit } from "react-icons/ci";
import { FaBed } from "react-icons/fa6";
import { create, deleteObject, list, save } from "../db/rate_plan";
import CounterInput from "./CounterInput";

export type RatePlan = {
  id?: string;
  roomId: string;
  name: string;
  status: string;
  description?: string;
  appliedStartDate: Date;
  appliedEndDate: Date;
  basePrice: number;
  baseOccupancy: number;
  extraOccupancyPrice?: number;
  includedMeals?: string[];
  tenantId: string;
};

const defaultRatePlan: RatePlan = {
  roomId: "",
  name: "",
  status: "ACTIVE",
  tenantId: "",
  appliedStartDate: new Date(),
  appliedEndDate: addDays(new Date(), 30),
  baseOccupancy: 2,
  basePrice: 500000,
};

type RoomManagerProps = {
  chat: Chat;
  authorizedUserId: string | null;
  displayName: string;
  activeMenu: any;
  handleUnauthorized: any;
  hasAuthority: (auth: string) => boolean;
};

export const RatePlanManager = memo((props: RoomManagerProps) => {
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);

  const [openDelModal, setOpenDelModal] = useState(false);

  const [openEditingModal, setOpenEditingModal] = useState(false);
  const [editingRatePlan, setEditingRatePlan] = useState<RatePlan>(defaultRatePlan);

  const deleteAuthorized = props.hasAuthority("rate-plan:delete");

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

  const fetchRatePlans = async () => {
    try {
      let byDate = formatISODate(new Date());

      let res = await list(pagination.pageNumber, pagination.pageSize);
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
      setRatePlans(sortedExps);
      setPagination({
        pageNumber: data.number,
        pageSize: data.size,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
      });
    } catch (e) {
      console.error("Error while fetching rooms", e);
      if (e instanceof Error) {
        alert(e.message);
      }
    }
  };

  useEffect(() => {
    props.activeMenu();
    fetchRatePlans();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageNumber]);

  useEffect(() => {
    fetchRatePlans();

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
  const deleletConfirmation = (room: RatePlan) => {
    setEditingRatePlan(room);
    setOpenDelModal(true);
  };

  const cancelDelExpense = () => {
    setOpenDelModal(false);
    setEditingRatePlan(defaultRatePlan);
  };

  const confirmDelExpense = async () => {
    try {
      if (editingRatePlan === undefined || editingRatePlan === null) {
        return;
      }
      let res = await deleteObject(editingRatePlan.id!);
      if (res.status === 401 || res.status === 403) {
        props.handleUnauthorized();
        return;
      }
      if (res === undefined || res.status !== 200) {
        console.warn("Invalid room deletion response");
        return;
      }
      fetchRatePlans();
    } catch (e) {
      console.error(e);
    } finally {
      setOpenDelModal(false);
      setEditingRatePlan(defaultRatePlan);
    }
  };

  //================= EDIT ===================//
  const editRatePlan = (exp: RatePlan) => {
    setEditingRatePlan(exp);
    setOpenEditingModal(true);
  };

  const cancelEditing = () => {
    setEditingRatePlan(defaultRatePlan);
    setOpenEditingModal(false);
    fetchRatePlans();
  };



  const emptyTextInput = (fieldName: string) => {
    setEditingRatePlan({
      ...editingRatePlan,
      [fieldName]: "",
    });
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;

    setEditingRatePlan({
      ...editingRatePlan,
      [id]: value,
    });
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    const timePart = formatISODateTime(editingRatePlan[id as keyof RatePlan] as Date).split("T")[1];
    setEditingRatePlan({
      ...editingRatePlan,
      [id]: new Date(value + "T" + timePart),
    });
  };
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    let hourNum = parseInt(value, 10);
    let validHour = isNaN(hourNum) ? 0 : hourNum > 23 ? 23 : hourNum < 0 ? 0 : hourNum;
    let date = editingRatePlan[id as keyof RatePlan] as Date;
    date.setHours(validHour);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    const formattedValue = formatISODateTime(date)
    console.info("Parsed time: %s", formattedValue);
    setEditingRatePlan({
      ...editingRatePlan,
      [id]: date,
    });
  };
  const handleMealChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = event.target;
    let includedMeals = editingRatePlan.includedMeals || [];
    if (checked && !includedMeals.includes(id)) {
      includedMeals.push(id);
    } else if (!checked) {
      includedMeals = includedMeals.filter((meal) => meal !== id);
    }
    setEditingRatePlan({
      ...editingRatePlan,
      includedMeals: includedMeals,
    });
  };

  const changeQuantity = (fieldName: string, delta: number) => {
    setEditingRatePlan({
      ...editingRatePlan,
      [fieldName]: delta,
    });
  };


  const processSave = async () => {
    console.info("Saving rate plan %s...", editingRatePlan.id ?? "new");
    let res = null;
    if (editingRatePlan.id === null || editingRatePlan.id === undefined) {
      // New room
      res = await create(editingRatePlan);
    } else {
      // Existing room
      res = await save(editingRatePlan);
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
    fetchRatePlans();
  };

  const handleSave = () => {
    processSave();
  };


  return (
    <div className="relative h-full pt-3">
      <div className="flex flex-row space-x-2 px-2 align-middle">
        <Button size="xs" color="green" onClick={() => editRatePlan(defaultRatePlan)}>
          <MdAssignmentAdd size="1.5em" className="mr-2" /> Add Rate Plan
        </Button>
      </div>
      <div className="flex flex-col space-y-1.5 divide-y px-2 pt-2">
        {ratePlans?.map((room) => {
          return (
            <div
              key={room.id}
              className="relative flex w-full flex-col space-y-1 px-1"
            >
              <div className="font text-sm text-green-600">
                {room.name}
              </div>
              <div className="flex flex-row space-x-3 text-[10px]">
                {/* Adult icon and count */}
                <div className="flex items-center space-x-1">
                  <MdOutlineMan size="1em" className="text-yellow-700" />
                  <span>{room.roomId}</span>
                </div>
                {/* Child icon and count */}
                <div className="flex items-center space-x-1">
                  <MdOutlineFamilyRestroom
                    size="1em"
                    className="text-yellow-700"
                  />
                  <span>{room.appliedStartDate ? formatISODate(room.appliedStartDate) : "N/A"}</span>
                </div>
                {/* Double bed icon and count */}
                <div className="flex items-center space-x-1">
                  <FaBed size="1em" className="text-yellow-700" />
                  <span>{room.appliedEndDate ? formatISODate(room.appliedEndDate) : "N/A"}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FaUmbrellaBeach size="1em" className="text-yellow-700" />
                  <span>{room.basePrice ?? 0}</span>
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
                  onClick={() => editRatePlan(room)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <nav
        className="absolute bottom-1 flex items-center justify-between pt-4"
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
          <li onClick={() => handlePaginationClick(0)} className={pageClass(0)}>
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

      <Modal show={openDelModal} onClose={cancelDelExpense}>
        <Modal.Header>Confirm</Modal.Header>
        <Modal.Body>
          <div>
            <span>
              {editingRatePlan === null
                ? ""
                : "Are you sure to delete room [" + editingRatePlan?.name + "]?"}
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
          <div className="w-full h-full space-y-2 pb-2 sm:pb-6 lg:px-8 xl:pb-8">
            <div className="flex w-full flex-col align-middle">
              <div className="flex w-3/5 items-center">
                <Label htmlFor="name" value="Room Name" />
              </div>
              <TextInput
                id="name"
                placeholder="Breakfast"
                required={true}
                value={editingRatePlan?.name}
                onChange={handleTextChange}
                className="w-full"
                rightIcon={() => <HiX onClick={() => emptyTextInput("name")} />}
              />
            </div>
            <div className="flex w-full flex-col align-middle">
              <div className="flex w-3/5 items-center">
                <Label htmlFor="description" value="Internal Name" />
              </div>
              <TextInput
                id="description"
                placeholder="Breakfast included"
                required={true}
                value={editingRatePlan?.description}
                onChange={handleTextChange}
                className="w-full"
                rightIcon={() => (
                  <HiX onClick={() => emptyTextInput("description")} />
                )}
              />
            </div>
            <div className="flex w-full flex-col align-middle">
              <div className="flex w-3/5 items-center">
                <Label htmlFor="appliedStartDate" value="Start Date" />
              </div>

              <div className="flex flex-row w-full">
                <Datepicker
                  id="appliedStartDate"
                  required={true}
                  type="date"
                  value={formatISODate(editingRatePlan?.appliedStartDate)}
                  onChange={handleDateChange}
                />
                <TextInput
                  id="appliedStartDate"
                  type="number"
                  required={true}
                  value={editingRatePlan?.appliedStartDate?.getHours()}
                  onChange={handleTimeChange}
                  className="ml-2"
                />
              </div>
            </div>
            <div className="flex w-full flex-col align-middle">
              <div className="flex w-3/5 items-center">
                <Label htmlFor="appliedEndDate" value="End Date" />
              </div>

              <div className="flex flex-row w-full">
                <Datepicker
                  id="appliedEndDate"
                  required={true}
                  type="date"
                  value={formatISODate(editingRatePlan?.appliedEndDate)}
                  onChange={handleDateChange}
                />
                <TextInput
                  id="appliedEndDate"
                  type="number"
                  required={true}
                  value={editingRatePlan?.appliedEndDate?.getHours()}
                  onChange={handleTimeChange}
                  className="ml-2"
                />
              </div>
              <div className="flex w-full flex-row align-middle">
                <div className="flex w-3/5 items-center">
                  <Label htmlFor="baseOccupancy" value="Base Occupancy" />
                </div>
                <CounterInput<RatePlan>
                  name="baseOccupancy"
                  value={editingRatePlan.baseOccupancy}
                  onChange={changeQuantity}
                  min={1}
                />
              </div>
              <div className="flex w-full flex-row align-middle">
                <div className="flex w-3/5 items-center">
                  <Label htmlFor="basePrice" value="Base Price" />
                </div>
                <CounterInput<RatePlan>
                  name="basePrice"
                  value={editingRatePlan.basePrice}
                  onChange={changeQuantity}
                  min={250000}
                  step={50000}
                />
              </div>
              <div className="flex w-full flex-row align-middle">
                <div className="flex w-3/5 items-center">
                  <Label
                    htmlFor="extraOccupancyPrice"
                    value="Extra Occupancy Price"
                  />
                </div>
                <CounterInput<RatePlan>
                  name="extraOccupancyPrice"
                  value={editingRatePlan.extraOccupancyPrice ?? 0}
                  onChange={changeQuantity}
                  min={0}
                  step={50000}
                />
              </div>
              <div className="flex w-full flex-col align-middle">
                <div className="flex w-3/5 items-center">
                  <Label htmlFor="includedMeals" value="Included Meals" />
                </div>
                <div className="flex flex-row space-x-4">
                  <div className="flex items-center gap-2">
                    <Checkbox id="breakfast" onChange={handleMealChange} />
                    <Label htmlFor="breakfast">Breakfast</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="lunch" />
                    <Label htmlFor="lunch">Lunch</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="dinner" />
                    <Label htmlFor="dinner">Dinner</Label>
                  </div>
                </div>
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
    </div>
  );
});
