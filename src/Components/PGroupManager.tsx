import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import {
  TextInput,
  Label,
  Modal,
  Button,
  Textarea,
  Checkbox,
} from "flowbite-react";
import { HiAdjustments, HiUserRemove, HiX } from "react-icons/hi";
import { deletePGroup, listAllPGroups, savePGroup } from "../db/pgroup";

export type PGroup = {
  groupId: string | null;
  name: string;
  displayName: string;
  availTime: string;
  unavailTime: string;
  displayOffset: number;
  description: string;
  status: string;
  includedGroupId: string | null;
  includedGroup: boolean;
  tenantId?: string;
  urlPath?: string;
};

const defaultPGroup = {
  groupId: null,
  name: "",
  displayName: "",
  availTime: "07:00:00",
  unavailTime: "19:00:00",
  displayOffset: -1,
  description: "",
  status: "DISABLED",
  includedGroupId: null,
  includedGroup: false,
  urlPath: "",
};

type PGroupProps = {
  activeMenu: any;
};

export const PGroupManager = (props: PGroupProps) => {
  const [pGroups, setPGroups] = useState<PGroup[]>([]);

  const [openDelModal, setOpenDelModal] = useState(false);
  const [deletingPGroup, setDeletingPGroup] = useState<PGroup>();
  const [showDelResult, setShowDelResult] = useState(false);
  const [delResult, setDelResult] = useState("");

  const [openEditingModal, setOpenEditingModal] = useState(false);
  const [editingPGroup, setEditingPGroup] = useState<PGroup>(defaultPGroup);
  const focusRef = useRef<HTMLInputElement>(null);

  const fetchPGroups = () => {
    return listAllPGroups().then((rsp) => {
      // Axios response: data is in rsp.data, status is rsp.status
      if (rsp.status === 200) {
        setPGroups(rsp.data.content);
      }
    });
  };

  useEffect(() => {
    props.activeMenu();
    fetchPGroups();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeletion = (group: PGroup) => {
    console.warn("Deleting group [%s]...", group.groupId);
    deletePGroup(group)
      .then((rsp) => {
        if (rsp.status === 200) {
          console.log("Delete group %s successfully", group.groupId);
          fetchPGroups();
          setDelResult("Delete group successfully");
          setShowDelResult(true);
        } else if (rsp.status === 500) {
          console.error("Failed to delete the product group", rsp.statusText);
          setDelResult(
            `Failed to delete the product group ${group.displayName}. Please check if the group is containing some products.`,
          );
          setShowDelResult(true);
        }
      })
      .catch((error) => {
        console.error("Failed to delete the product group", error);
        setDelResult("Failed to delete the product group");
        setShowDelResult(true);
      });
  };

  const askForDelConfirmation = (group: PGroup) => {
    setDeletingPGroup(group);
    setOpenDelModal(true);
  };

  const cancelDeletion = () => {
    setOpenDelModal(false);
    setDeletingPGroup(undefined);
  };

  const confirmDeletion = () => {
    try {
      if (deletingPGroup === undefined || deletingPGroup === null) {
        return;
      }
      handleDeletion(deletingPGroup);
    } catch (e) {
      console.error(e);
    } finally {
      setOpenDelModal(false);
      setDeletingPGroup(undefined);
    }
  };

  const editPGroup = (group: PGroup) => {
    setEditingPGroup(group);
    setOpenEditingModal(true);
  };

  const cancelEditing = () => {
    setEditingPGroup(defaultPGroup);
    setOpenEditingModal(false);
    fetchPGroups();
  };

  const handleTextInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    let { field, value } = {
      field: e.target.id,
      value: e.target.value,
    };
    let eI = {
      ...editingPGroup,
      [field]: value,
    };
    setEditingPGroup(eI);
  };

  const handleTextAreaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    let { field, value } = {
      field: e.target.id,
      value: e.target.value,
    };
    let eI = {
      ...editingPGroup,
      [field]: value,
    };
    setEditingPGroup(eI);
  };

  const emptyField = (field: string) => {
    let eI = {
      ...editingPGroup,
      [field]: "",
    };
    setEditingPGroup(eI);
  };

  const saveAndClose = () => {
    let grpId = editingPGroup.groupId;
    if (grpId === null || grpId === undefined) {
      console.error("Invalid group id");
      return;
    }
    let validUrlPath = editingPGroup.urlPath;
    if (validUrlPath !== null && validUrlPath !== undefined && validUrlPath.trim() !== "") {
      if (validUrlPath.endsWith("/")) {
        validUrlPath = validUrlPath.slice(0, -1);
      }
      if (!validUrlPath.startsWith("https://")){
        validUrlPath = "https://" + validUrlPath;
      }
    }
    console.log("Saving group with URL Path:", validUrlPath);
    let savingGroup = {
      ...editingPGroup,
      urlPath: validUrlPath,
    };

    savePGroup(savingGroup)
      .then((rsp) => {
        if (rsp.status === 200) {
          setOpenEditingModal(false);
          fetchPGroups();
        } else {
          console.error("Failed to save the product group", rsp.statusText);
        }
      })
      .catch((error) => {
        console.error("Failed to save the product group", error);
      });
  };

  const closeDelResult = () => {
    setShowDelResult(false);
    setDelResult("");
  };

  return (
    <div className="h-full pt-3">
      <div className="flex flex-row px-2">
        <div className="flex flex-row items-center pb-2">
          <svg
            className="h-5 w-5 text-amber-700 dark:text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 12h14m-7 7V5"
            />
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
            <div
              key={grp.groupId}
              className="relative flex flex-col border-b border-gray-200 px-2 py-1"
            >
              <div className="flex flex-row items-center space-x-2">
                <span className="font-bold text-green-800 dark:text-blue-500">
                  {grp.displayName}
                </span>
                <span className="text-[12px] text-gray-500 dark:text-gray-400">{`(${grp.name} - Id: ${grp.groupId})`}</span>
              </div>
              <div className="flex flex-row items-center space-x-2">
                <span className="font-mono text-[12px] font-black text-gray-500 dark:text-gray-400">
                  {grp.status}
                </span>
                <span className="font-mono text-[12px] font-black text-gray-500 dark:text-gray-400">
                  {grp.availTime}
                </span>
                <span className="font-mono text-[12px] font-black text-gray-500 dark:text-gray-400">
                  {grp.unavailTime}
                </span>
              </div>
              <div className="absolute right-3 top-2 flex flex-row space-x-4">
                <HiUserRemove onClick={() => askForDelConfirmation(grp)} />
                <HiAdjustments onClick={() => editPGroup(grp)} />
              </div>
            </div>
          );
        })}
      </div>

      <Modal show={openDelModal} onClose={cancelDeletion}>
        <Modal.Header>Confirm</Modal.Header>
        <Modal.Body>
          <div>
            <span>
              {deletingPGroup === null
                ? ""
                : "Are you sure to delete [" +
                  deletingPGroup?.displayName +
                  "]?"}
            </span>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={confirmDeletion}>Delete</Button>
          <Button color="gray" onClick={cancelDeletion}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal popup={true} show={showDelResult}>
        <Modal.Header>Confirm</Modal.Header>
        <Modal.Body>
          <span>{delResult}</span>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={closeDelResult}>Ok</Button>
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
            <div className="flex w-full flex-col space-y-1 align-middle">
              <div className="flex items-center">
                <Label htmlFor="groupId" value="Group Id OR Id:" />
              </div>
              <TextInput
                id="groupId"
                required={true}
                value={
                  editingPGroup.groupId === null ? "" : editingPGroup.groupId
                }
                onChange={handleTextInputChange}
                className="w-full"
              />
            </div>
            <div className="flex w-full flex-col space-y-1 align-middle">
              <div className="flex items-center">
                <Label htmlFor="name" value="Name:" />
              </div>
              <TextInput
                id="name"
                required={true}
                value={editingPGroup.name}
                onChange={handleTextInputChange}
                className="w-full"
                rightIcon={() => <HiX onClick={() => emptyField("name")} />}
              />
            </div>
            <div className="flex w-full flex-col space-y-1 py-2 align-middle">
              <div className="flex items-center">
                <Label htmlFor="displayName" value="Display Name:" />
              </div>
              <TextInput
                id="displayName"
                placeholder="Bánh mì"
                required={true}
                value={editingPGroup.displayName}
                onChange={handleTextInputChange}
                className="w-full"
                rightIcon={() => (
                  <HiX onClick={() => emptyField("displayName")} />
                )}
              />
            </div>
            <div className="flex w-full flex-col space-y-1 py-2 align-middle">
              <div className="flex items-center">
                <Label htmlFor="description" value="Description:" />
              </div>
              <Textarea
                id="description"
                required={false}
                value={editingPGroup.description}
                onChange={handleTextAreaChange}
                className="w-full"
              />
            </div>
            <div className="flex w-full flex-col space-y-1 py-2 align-middle">
              <div className="flex items-center">
                <Label htmlFor="urlPath" value="URL Path:" />
              </div>
              <TextInput
                id="urlPath"
                required={false}
                value={editingPGroup.urlPath}
                onChange={handleTextInputChange}
                className="w-full"
                rightIcon={() => <HiX onClick={() => emptyField("urlPath")} />}
              />
              <span className="text-[9px] italic text-gray-500 dark:text-gray-400">
                {editingPGroup?.urlPath && editingPGroup.groupId != null
                  ? `URL: ${editingPGroup.urlPath}/${editingPGroup.groupId}`
                  : "URL: Missing URL Path or Group Id"}
              </span>
            </div>
            <div className="flex w-full flex-col space-y-1 align-middle">
              <div className="flex items-center space-x-2">
                <Label htmlFor="status" value="Status:" />
                <select
                  id="status"
                  name="status"
                  className="w-full rounded-md border border-gray-500 text-base sm:text-sm"
                  value={editingPGroup.status}
                  onChange={(e) => {
                    let status = e.target.value;
                    let eI = {
                      ...editingPGroup,
                      status: status,
                    };
                    setEditingPGroup(eI);
                  }}
                >
                  <option value="ENABLED">ENABLED</option>
                  <option value="DISABLED">DISABLED</option>
                </select>
              </div>
            </div>
            <div className="flex w-full flex-col space-y-1 align-middle">
              <Label htmlFor="available" value="Available Time:" />
              <div className="flex flex-row items-center space-x-2">
                <TextInput
                  id="availTime"
                  type="time"
                  required={true}
                  value={editingPGroup.availTime}
                  onChange={handleTextInputChange}
                  className="w-32"
                />{" "}
                -
                <TextInput
                  id="unavailTime"
                  type="time"
                  required={true}
                  value={editingPGroup.unavailTime}
                  onChange={handleTextInputChange}
                  className="w-32"
                />
              </div>
            </div>
            <div className="flex w-full flex-col space-y-1 align-middle">
              <div className="flex items-center space-x-2">
                <Label htmlFor="includedGroup" value="Is Included Group:" />
                <Checkbox
                  id="includedGroup"
                  checked={editingPGroup.includedGroup}
                  onChange={(e) => {
                    let eI = {
                      ...editingPGroup,
                      includedGroup: e.target.checked,
                    };
                    setEditingPGroup(eI);
                  }}
                />
              </div>
            </div>
            {editingPGroup.includedGroup === false ? (
              <></>
            ) : (
              <div className="flex w-full flex-col space-y-1 align-middle">
                <Label htmlFor="includedGroupId" value="Included Group Id:" />
                <TextInput
                  id="includedGroupId"
                  required={false}
                  value={
                    editingPGroup.includedGroupId === null
                      ? ""
                      : editingPGroup.includedGroupId
                  }
                  onChange={handleTextInputChange}
                  className="w-full"
                />
              </div>
            )}
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
    </div>
  );
};
