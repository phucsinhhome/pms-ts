import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { Table, TextInput, Label, Modal, Button } from "flowbite-react";
import { HiX } from "react-icons/hi";
import { deletePGroup, listAllPGroups } from "../db/pgroup";

export type PGroup = {
  groupId: string | null,
  name: string,
  displayName: string,
  availTime: string,
  unavailTime: string,
  displayOffset: number,
  description: string,
  status: string,
  includedGroupId: string | null,
  includedGroup: boolean
}

const defaultPGroup = {
  groupId: null,
  name: '',
  displayName: '',
  availTime: '07:00:00',
  unavailTime: '19:00:00',
  displayOffset: -1,
  description: '',
  status: 'DISABLED',
  includedGroupId: null,
  includedGroup: false
}

type PGroupProps = {
  activeMenu: any
}

export const PGroupManager = (props: PGroupProps) => {

  const [pGroups, setPGroups] = useState<PGroup[]>([])

  const [openDelModal, setOpenDelModal] = useState(false)
  const [deletingPGroup, setDeletingPGroup] = useState<PGroup>()

  const [openEditingModal, setOpenEditingModal] = useState(false)
  const [editingPGroup, setEditingPGroup] = useState<PGroup>(defaultPGroup)
  const focusRef = useRef<HTMLInputElement>(null)


  const fetchPGroups = () => {
    return listAllPGroups()
      .then((rsp) => {
        if (rsp.ok) {
          rsp.json()
            .then(data => { setPGroups(data.content) })
        }
      })
  }

  useEffect(() => {
    props.activeMenu()
    fetchPGroups()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeletion = (group: PGroup) => {
    console.warn("Deleting group [%s]...", group.groupId)
    deletePGroup(group)
      .then((rsp: any) => {
        if (rsp !== null) {
          console.log("Delete group %s successully", group.groupId)
          fetchPGroups()
        }
      })
  }
  
  const askForDelConfirmation = (group: PGroup) => {
    setDeletingPGroup(group);
    setOpenDelModal(true)
  }

  const cancelDeletion = () => {
    setOpenDelModal(false)
    setDeletingPGroup(undefined)
  }

  const confirmDeletion = () => {
    try {
      if (deletingPGroup === undefined || deletingPGroup === null) {
        return;
      }
      handleDeletion(deletingPGroup)
    } catch (e) {
      console.error(e)
    } finally {
      setOpenDelModal(false)
      setDeletingPGroup(undefined)
    }

  }
  
  const editPGroup = (group: PGroup) => {
    setEditingPGroup(group)
    setOpenEditingModal(true)
  }

  const cancelEditing = () => {
    setEditingPGroup(defaultPGroup)
    setOpenEditingModal(false)
    fetchPGroups()
  }

  const changeName = (e: ChangeEvent<HTMLInputElement>) => {
    let iMsg = e.target.value
    let eI = {
      ...editingPGroup,
      itemMessage: iMsg
    }
    setEditingPGroup(eI)
  }

  const changeDisplayName = (e: ChangeEvent<HTMLInputElement>) => {
    let iName = e.target.value
    let eI = {
      ...editingPGroup,
      displayName: iName
    }
    setEditingPGroup(eI)
  }

  const emptyDisplayName = () => {
    let eI = {
      ...editingPGroup,
      displayName: ''
    }
    setEditingPGroup(eI)
  }

  return (
    <div className="h-full pt-3">
      <div className="flex flex-row px-2">
        <div className="flex flex-row items-center pl-4 pb-2">
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
          <span
            onClick={() => editPGroup(defaultPGroup)}
            className="font-bold text-amber-800"
          >
            Add Group
          </span>
        </div>
      </div>
      <div className="h-3/5 max-h-fit overflow-hidden">
        <Table hoverable={true}>
          <Table.Head>
            <Table.HeadCell className="sm:px-1">
              Date
            </Table.HeadCell>
            <Table.HeadCell className="sm:px-1">
              Details
            </Table.HeadCell>

            <Table.HeadCell>
              <span className="sr-only">
                Delete
              </span>
            </Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y" >
            {pGroups.map((exp) => {
              return (
                <Table.Row
                  className="bg-white"
                  key={exp.groupId}
                >
                  <Table.Cell className="sm:px-1 py-0.5">
                    <div className="grid grid-cols-1">
                      <Label
                        onClick={() => editPGroup(exp)}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                        value={exp.displayName}
                      />
                      <div className="flex flex-row text-sm space-x-1">
                        <span className="font font-mono font-black w-20">{exp.status}</span>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell className=" py-0.5">
                    <svg
                      className="w-6 h-6 text-red-800 dark:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24" fill="none" viewBox="0 0 24 24"
                      onClick={() => askForDelConfirmation(exp)}
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


      <Modal show={openDelModal} onClose={cancelDeletion}>
        <Modal.Header>Confirm</Modal.Header>
        <Modal.Body>
          <div>
            <span>{deletingPGroup === null ? "" : "Are you sure to delete [" + deletingPGroup?.displayName + "]?"}</span>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={confirmDeletion}>Delete</Button>
          <Button color="gray" onClick={cancelDeletion}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={openEditingModal}
        size="md"
        popup={true}
        onClose={cancelEditing}
        initialFocus={focusRef}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="space-y-6 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
            <div className="flex flex-col w-full">
              <TextInput
                id="itemMsg"
                placeholder="3 ổ bánh mì 6k"
                required={true}
                value={editingPGroup.name}
                onChange={changeName}
                className="w-full"
                ref={focusRef}
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
                value={editingPGroup.displayName}
                onChange={changeDisplayName}
                className="w-full"
                rightIcon={() => <HiX onClick={emptyDisplayName} />}
              />
            </div>
            <div className="w-full flex justify-center">
              <Button className="mx-2">
                Save & Close
              </Button>
              <Button onClick={cancelEditing} className="mx-2">
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div >
  );
}
