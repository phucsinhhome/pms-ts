import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { TextInput, Label, Modal, Button, Textarea } from "flowbite-react";
import { HiAdjustments, HiUserRemove, HiX } from "react-icons/hi";
import { deletePGroup, listAllPGroups, savePGroup } from "../db/pgroup";

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

  const changeDisplayName = (e: ChangeEvent<HTMLInputElement>) => {
    let iName = e.target.value
    let eI = {
      ...editingPGroup,
      displayName: iName
    }
    setEditingPGroup(eI)
  }

  const changeGroupId = (e: ChangeEvent<HTMLInputElement>) => {
    let iName = e.target.value
    let eI = {
      ...editingPGroup,
      groupId: iName,
      id: iName
    }
    setEditingPGroup(eI)
  }

  const changeName = (e: ChangeEvent<HTMLInputElement>) => {
    let iName = e.target.value
    let eI = {
      ...editingPGroup,
      name: iName
    }
    setEditingPGroup(eI)
  }

  const changeDescription = (e: ChangeEvent<HTMLTextAreaElement>) => {
    let description = e.target.value
    let eI = {
      ...editingPGroup,
      description: description
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

  const saveAndClose = () => {
    // Add your save logic here
    // Assuming you have a function to save the product group to the back-end API

    let grpId = editingPGroup.groupId
    if (grpId === null || grpId === undefined) {
      console.error("Invalid group id")
      return
    }
    let savingGroup = {
      ...editingPGroup
    }

    savePGroup(savingGroup)
      .then((rsp) => {
        if (rsp.ok) {
          setOpenEditingModal(false);
          fetchPGroups();
        } else {
          console.error("Failed to save the product group", rsp.statusText);
        }
      }).catch((error) => {
        console.error("Failed to save the product group", error);
      });
  }

  return (
    <div className="h-full pt-3">
      <div className="flex flex-row px-2">
        <div className="flex flex-row items-center pb-2">
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
      <div className="flex flex-col overflow-scroll">
        {pGroups.map((grp) => {
          return (
            <div key={grp.groupId} className="flex flex-col px-2 py-1 border-b border-gray-200 relative">
              <div className="flex flex-row items-center space-x-2">
                <span className="font-bold text-green-800 dark:text-blue-500">{grp.displayName}</span>
                <span className="text-gray-500 text-[12px] dark:text-gray-400">{`(${grp.name} - Id: ${grp.groupId})`}</span>

              </div>
              <div className="flex flex-row items-center space-x-2">
                <span className="font-mono font-black text-[12px] text-gray-500 dark:text-gray-400">{grp.status}</span>
                <span className="font-mono font-black text-[12px] text-gray-500 dark:text-gray-400">{grp.availTime}</span>
                <span className="font-mono font-black text-[12px] text-gray-500 dark:text-gray-400">{grp.unavailTime}</span>
              </div>
              <div className="flex flex-row space-x-2 absolute right-1 top-2">
                <HiUserRemove onClick={() => askForDelConfirmation(grp)} />
                <HiAdjustments onClick={() => editPGroup(grp)} />
              </div>
            </div>
          )
        })}
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
          <div className="space-y-1">
            <div className="flex flex-col w-full align-middle space-y-1">
              <div className="flex items-center">
                <Label
                  htmlFor="groupId"
                  value="Group Id OR Id:"
                />
              </div>
              <TextInput
                id="groupId"
                required={true}
                value={editingPGroup.groupId === null ? '' : editingPGroup.groupId}
                onChange={changeGroupId}
                className="w-full"
              />
            </div>
            <div className="flex flex-col w-full align-middle space-y-1">
              <div className="flex items-center">
                <Label
                  htmlFor="name"
                  value="Name:"
                />
              </div>
              <TextInput
                id="name"
                required={true}
                value={editingPGroup.name}
                onChange={changeName}
                className="w-full"
              />
            </div>
            <div className="flex flex-col w-full align-middle space-y-1 py-2">
              <div className="flex items-center">
                <Label
                  htmlFor="itemName"
                  value="Display Name:"
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
            <div className="flex flex-col w-full align-middle space-y-1 py-2">
              <div className="flex items-center">
                <Label
                  htmlFor="description"
                  value="Description:"
                />
              </div>
              <Textarea
                id="description"
                required={false}
                value={editingPGroup.description}
                onChange={changeDescription}
                className="w-full"
              />
            </div>
            <div className="flex flex-col w-full align-middle space-y-1">
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="displayOffset"
                  value="Offset:"
                />
                <span className="font-mono font-black text-sm text-gray-500 dark:text-gray-400">{editingPGroup.displayOffset}</span>
              </div>
            </div>
            <div className="flex flex-col w-full align-middle space-y-1">
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="status"
                  value="Status:"
                />
                <span className="font-mono font-black text-sm text-gray-500 dark:text-gray-400">{editingPGroup.status}</span>
              </div>
            </div>
            <div className="flex flex-col w-full align-middle space-y-1">
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="availTime"
                  value="Avail Time:"
                />
                <span className="font-mono font-black text-sm text-gray-500 dark:text-gray-400">{editingPGroup.availTime}</span>
              </div>
            </div>
            <div className="flex flex-col w-full align-middle space-y-1">
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="unavailTime"
                  value="Unavail Time:"
                />
                <span className="font-mono font-black text-sm text-gray-500 dark:text-gray-400">{editingPGroup.unavailTime}</span>
              </div>
            </div>
            <div className="flex flex-col w-full align-middle space-y-1">
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="includedGroup"
                  value="Is Included Group:"
                />
                <span className="font-mono font-black text-sm text-gray-500 dark:text-gray-400">{editingPGroup.includedGroup ? 'true' : 'false'}</span>
              </div>
            </div>
            <div className="flex flex-col w-full align-middle space-y-1" hidden={editingPGroup.includedGroup === true}>
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="includedGroupId"
                  value="Included Group Id:"
                />
                <span className="font-mono font-black text-sm text-gray-500 dark:text-gray-400">{editingPGroup.includedGroupId}</span>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-1">
          <Button className="mx-2" onClick={saveAndClose}>
            Save
          </Button>
          <Button onClick={cancelEditing} className="mx-2">
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div >
  );
}

