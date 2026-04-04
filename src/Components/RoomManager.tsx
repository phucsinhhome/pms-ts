import React, { useState, useEffect } from "react";
import { Button, Modal, Label, TextInput, Table, Spinner, Select } from "flowbite-react";
import { Chat, DEFAULT_PAGE_SIZE } from "../App";
import { listRoom, createRoom, updateRoom, deleteRoom, Room } from "../db/room";
import { HiOutlineExclamationCircle, HiPlus, HiPencil, HiTrash, HiUserGroup, HiOutlineViewGrid, HiBadgeCheck } from "react-icons/hi";
import { Pagination } from "./ProfitReport";

type RoomManagerProps = {
  chat: Chat,
  displayName: string,
  authorizedUserId: string | null,
  activeMenu: any,
  handleUnauthorized: any,
  hasAuthority: (auth: string) => boolean
}

const defaultEmptyRoom: Partial<Room> = {
  name: "",
  internalName: "",
  status: "AVAILABLE",
  maxAdults: 2,
  numDoubleBeds: 1
};

export function RoomManager(props: RoomManagerProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0
  });

  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Partial<Room>>(defaultEmptyRoom);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRooms = (rooms || []).filter(room => 
    (room.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (room.internalName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchRooms = async (page = 0) => {
    setLoading(true);
    try {
      const res = await listRoom(page, pagination.pageSize);
      if (res.status === 200) {
        setRooms(res.data.content);
        setPagination({
          pageNumber: res.data.number,
          pageSize: res.data.size,
          totalElements: res.data.totalElements,
          totalPages: res.data.totalPages
        });
      }
    } catch (e) {
      console.error("Error while fetching rooms", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    props.activeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddClick = () => {
    setEditingRoom(defaultEmptyRoom);
    setOpenModal(true);
  };

  const handleEditClick = (room: Room) => {
    setEditingRoom(room);
    setOpenModal(true);
  };

  const handleDeleteClick = (room: Room) => {
    setDeletingRoom(room);
    setOpenDeleteModal(true);
  };

  const handleSaveRoom = async () => {
    try {
      if (editingRoom.id) {
        await updateRoom(editingRoom as Room);
      } else {
        await createRoom(editingRoom);
      }
      setOpenModal(false);
      fetchRooms(pagination.pageNumber);
    } catch (e) {
      console.error("Error saving room", e);
      alert("Failed to save room");
    }
  };

  const confirmDelete = async () => {
    if (!deletingRoom?.id) return;
    try {
      await deleteRoom(deletingRoom.id);
      setOpenDeleteModal(false);
      fetchRooms(pagination.pageNumber);
    } catch (e) {
      console.error("Error deleting room", e);
      alert("Failed to delete room");
    }
  };

  return (
    <div className="p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-green-900">Room Management</h1>
        <Button color="green" onClick={handleAddClick} className="w-full sm:w-auto">
          <HiPlus className="mr-2 h-5 w-5" /> Add Room
        </Button>
      </div>

      <div className="mb-4">
        <TextInput
          id="search"
          type="text"
          placeholder="Search rooms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 sm:hidden mb-4">
        {loading ? (
          <div className="text-center py-10">
            <Spinner size="xl" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No rooms found.
          </div>
        ) : (
          filteredRooms.map((room) => (
            <div key={room.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">{room.internalName}</span>
                  <span className="text-xl font-bold text-green-900">{room.name}</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="xs" color="gray" onClick={() => handleEditClick(room)}>
                    <HiPencil className="h-4 w-4" />
                  </Button>
                  <Button size="xs" color="failure" onClick={() => handleDeleteClick(room)}>
                    <HiTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center text-xs text-gray-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                  <HiBadgeCheck className={`mr-1.5 h-4 w-4 ${room.status === 'AVAILABLE' ? 'text-green-500' : 'text-yellow-500'}`} />
                  <span className="font-semibold uppercase">{room.status || 'N/A'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                  <HiUserGroup className="mr-1.5 h-4 w-4 text-blue-500" />
                  <span>Max Adults: <b>{room.maxAdults || 0}</b></span>
                </div>
                <div className="flex items-center text-xs text-gray-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                  <HiOutlineViewGrid className="mr-1.5 h-4 w-4 text-indigo-500" />
                  <span>Beds: <b>{room.numDoubleBeds || 0}</b></span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto shadow-sm sm:rounded-lg border border-gray-100">
        <Table hoverable>
          <Table.Head>
            <Table.HeadCell className="bg-green-100">Internal Name</Table.HeadCell>
            <Table.HeadCell className="bg-green-100">Display Name</Table.HeadCell>
            <Table.HeadCell className="bg-green-100 text-center">Actions</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={3} className="text-center py-10">
                  <Spinner size="xl" />
                </Table.Cell>
              </Table.Row>
            ) : filteredRooms.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={3} className="text-center py-10 text-gray-500">
                  No rooms found.
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredRooms.map((room) => (
                <Table.Row key={room.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="whitespace-nowrap font-bold text-gray-900 dark:text-white">
                    {room.internalName}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <span className="font-bold text-green-900 dark:text-white text-lg">
                        {room.name}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <div className="flex items-center text-[10px] text-gray-500 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 shadow-sm">
                          <HiBadgeCheck className={`mr-1 h-3 w-3 ${room.status === 'AVAILABLE' ? 'text-green-500' : 'text-yellow-500'}`} />
                          <span className="font-semibold uppercase">{room.status || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-[10px] text-gray-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shadow-sm">
                          <HiUserGroup className="mr-1 h-3 w-3 text-blue-500" />
                          <span>Max: <b>{room.maxAdults || 0}</b></span>
                        </div>
                        <div className="flex items-center text-[10px] text-gray-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shadow-sm">
                          <HiOutlineViewGrid className="mr-1 h-3 w-3 text-indigo-500" />
                          <span>Beds: <b>{room.numDoubleBeds || 0}</b></span>
                        </div>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-center space-x-2">
                      <Button size="xs" color="gray" onClick={() => handleEditClick(room)}>
                        <HiPencil className="h-4 w-4" />
                      </Button>
                      <Button size="xs" color="failure" onClick={() => handleDeleteClick(room)}>
                        <HiTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      <Modal show={openModal} onClose={() => setOpenModal(false)}>
        <Modal.Header>{editingRoom.id ? "Edit Room" : "Add New Room"}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="internalName" value="Internal Room Name" />
                </div>
                <TextInput
                  id="internalName"
                  placeholder="e.g. R1, VIP1"
                  value={editingRoom.internalName}
                  onChange={(e) => setEditingRoom({ ...editingRoom, internalName: e.target.value })}
                  required
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="status" value="Status" />
                </div>
                <Select
                  id="status"
                  value={editingRoom.status || "AVAILABLE"}
                  onChange={(e) => setEditingRoom({ ...editingRoom, status: e.target.value })}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="DIRTY">Dirty</option>
                  <option value="CLEANING">Cleaning</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </Select>
              </div>
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="name" value="Display Name" />
              </div>
              <TextInput
                id="name"
                placeholder="e.g. Room 101"
                value={editingRoom.name}
                onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="maxAdults" value="Max Adults" />
                </div>
                <TextInput
                  id="maxAdults"
                  type="number"
                  placeholder="2"
                  value={editingRoom.maxAdults || 0}
                  onChange={(e) => setEditingRoom({ ...editingRoom, maxAdults: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="numDoubleBeds" value="Double Beds" />
                </div>
                <TextInput
                  id="numDoubleBeds"
                  type="number"
                  placeholder="1"
                  value={editingRoom.numDoubleBeds || 0}
                  onChange={(e) => setEditingRoom({ ...editingRoom, numDoubleBeds: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="green" onClick={handleSaveRoom}>Save</Button>
          <Button color="gray" onClick={() => setOpenModal(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={openDeleteModal} size="md" popup onClose={() => setOpenDeleteModal(false)}>
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete room <b>{deletingRoom?.internalName}</b>?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={confirmDelete}>
                Yes, I'm sure
              </Button>
              <Button color="gray" onClick={() => setOpenDeleteModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
