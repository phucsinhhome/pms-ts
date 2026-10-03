import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Checkbox, Label, Modal, Select, Spinner, Table, Textarea, TextInput } from "flowbite-react";
import { HiCalendar, HiOutlineExclamationCircle, HiPencil, HiPlus, HiTrash } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { Chat, DEFAULT_PAGE_SIZE } from "../App";
import { Pagination } from "./ProfitReport";
import {
  Activity,
  createActivity,
  DEFAULT_TIERS,
  deleteActivity,
  listActivities,
  previewSlots,
  PricingTier,
  tierUnitPrice,
  updateActivity
} from "../db/activity";
import { listUsers } from "../db/users";
import { formatVND } from "../Service/Utils";

type ActivityManagerProps = {
  chat: Chat,
  displayName: string,
  authorizedUserId: string | null,
  activeMenu: any,
  handleUnauthorized: any,
  hasAuthority: (auth: string) => boolean
}

const emptyActivity: Activity = {
  type: "",
  title: "",
  description: "",
  imageUrl: "",
  durationMins: 240,
  bufferMins: 60,
  openTime: "08:00",
  closeTime: "17:00",
  basePrice: 0,
  minGuests: 1,
  maxCapacity: 10,
  defaultHostId: "",
  pricingTiers: DEFAULT_TIERS.map(t => ({ ...t })),
  active: true
};

const hhmm = (t?: string) => (t || "").slice(0, 5);

/**
 * Staff usernames for host pickers. Listing users needs the `user` authority, which activity staff may not have:
 * on any error (401/403 included) `users` stays null so callers fall back to free text. It never redirects to login.
 */
export function useStaffUsers(): string[] | null {
  const [users, setUsers] = useState<string[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rsp = await listUsers(0, 100);
        const names = (rsp.data?.content || [])
          .map((u: { username?: string }) => u.username)
          .filter((n: string | undefined): n is string => !!n);
        if (!cancelled) setUsers(names);
      } catch (e) {
        console.info("Staff user list unavailable; using free-text host input", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return users;
}

type HostPickerProps = {
  id: string,
  users: string[] | null,
  value: string,
  onChange: (value: string) => void
}

/** A Select of staff usernames, or a free-text username input when the list is unavailable. */
export function HostPicker(props: HostPickerProps) {
  if (props.users === null) {
    return <TextInput id={props.id} placeholder="Username" value={props.value}
      onChange={(e) => props.onChange(e.target.value)} />;
  }
  const options = props.value && !props.users.includes(props.value) ? [props.value, ...props.users] : props.users;
  return (
    <Select id={props.id} value={props.value} onChange={(e) => props.onChange(e.target.value)}>
      <option value="">No host</option>
      {options.map(u => <option key={u} value={u}>{u}</option>)}
    </Select>
  );
}

export function ActivityManager(props: ActivityManagerProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    totalPages: 0
  });
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Activity>(emptyActivity);
  const [deleting, setDeleting] = useState<Activity | null>(null);
  const staffUsers = useStaffUsers();
  const navigate = useNavigate();

  const canCreate = props.hasAuthority("activity:create");
  const canDelete = props.hasAuthority("activity:delete");

  /** Returns true when the error was handled as a failed login. */
  const handleError = (e: unknown, fallback: string, deleteHint = false): boolean => {
    if (axios.isAxiosError(e)) {
      const status = e.response?.status;
      if (status === 401 || status === 403) {
        props.handleUnauthorized();
        return true;
      }
      const message = e.response?.data?.message;
      if (status === 409 && deleteHint) {
        alert(`${message ?? 'The activity has open sessions'}. Edit it and untick "Active" to hide it from guests instead.`);
        return false;
      }
      if (status === 400 || status === 404 || status === 409) {
        alert(message ?? fallback);
        return false;
      }
    }
    console.error(fallback, e);
    alert(fallback);
    return false;
  };

  const fetchActivities = async (page = pagination.pageNumber) => {
    setLoading(true);
    try {
      const res = await listActivities(page, pagination.pageSize);
      setActivities(res.data.content || []);
      setPagination({
        pageNumber: res.data.number,
        pageSize: res.data.size,
        totalElements: res.data.totalElements,
        totalPages: res.data.totalPages
      });
    } catch (e) {
      handleError(e, "Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(0);
    props.activeMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToPage = (page: number) => {
    if (page < 0 || page >= pagination.totalPages || page === pagination.pageNumber) return;
    fetchActivities(page);
  };

  const handleAdd = () => {
    setEditing({ ...emptyActivity, pricingTiers: DEFAULT_TIERS.map(t => ({ ...t })) });
    setOpenModal(true);
  };

  const handleEdit = (a: Activity) => {
    setEditing({
      ...emptyActivity,
      ...a,
      openTime: hhmm(a.openTime),
      closeTime: hhmm(a.closeTime),
      defaultHostId: a.defaultHostId || "",
      pricingTiers: (a.pricingTiers || []).map(t => ({ ...t }))
    });
    setOpenModal(true);
  };

  const handleSave = async () => {
    const body: Activity = {
      ...editing,
      defaultHostId: editing.defaultHostId?.trim() || undefined,
      description: editing.description?.trim() || undefined,
      imageUrl: editing.imageUrl?.trim() || undefined
    };
    setSaving(true);
    try {
      if (body.id) {
        await updateActivity(body);
      } else {
        await createActivity(body);
      }
      setOpenModal(false);
      fetchActivities();
    } catch (e) {
      handleError(e, "Failed to save the activity");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting?.id) return;
    try {
      await deleteActivity(deleting.id);
      setDeleting(null);
      fetchActivities();
    } catch (e) {
      setDeleting(null);
      handleError(e, "Failed to delete the activity", true);
    }
  };

  const set = <K extends keyof Activity>(key: K, value: Activity[K]) => setEditing(prev => ({ ...prev, [key]: value }));
  const num = (v: string) => (v === "" ? 0 : Number(v));

  const setTier = (index: number, patch: Partial<PricingTier>) =>
    set("pricingTiers", editing.pricingTiers.map((t, i) => (i === index ? { ...t, ...patch } : t)));

  const addTier = () => {
    const last = editing.pricingTiers[editing.pricingTiers.length - 1];
    const min = last ? (last.maxGuests ?? last.minGuests) + 1 : 1;
    set("pricingTiers", [...editing.pricingTiers, { minGuests: min, maxGuests: null, discountPct: 0 }]);
  };

  const removeTier = (index: number) => set("pricingTiers", editing.pricingTiers.filter((_, i) => i !== index));

  const slots = previewSlots(editing);

  const field = (id: string, label: string, input: React.ReactNode) => (
    <div>
      <div className="mb-1 block"><Label htmlFor={id} value={label} /></div>
      {input}
    </div>
  );

  return (
    <div className="p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-green-900">Activity Management</h1>
        <div className="flex w-full sm:w-auto gap-2">
          <Button color="gray" onClick={() => navigate("/activity/sessions")} className="w-full sm:w-auto">
            <HiCalendar className="mr-2 h-5 w-5" /> Sessions
          </Button>
          {canCreate && (
            <Button color="green" onClick={handleAdd} className="w-full sm:w-auto">
              <HiPlus className="mr-2 h-5 w-5" /> Add Activity
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-240px)] shadow-sm sm:rounded-lg border border-gray-100">
        <Table hoverable>
          <Table.Head>
            <Table.HeadCell className="bg-green-100 sticky top-0 z-10">Type</Table.HeadCell>
            <Table.HeadCell className="bg-green-100 sticky top-0 z-10">Title</Table.HeadCell>
            <Table.HeadCell className="bg-green-100 sticky top-0 z-10">Window</Table.HeadCell>
            <Table.HeadCell className="bg-green-100 sticky top-0 z-10">Duration / Buffer</Table.HeadCell>
            <Table.HeadCell className="bg-green-100 sticky top-0 z-10">Base price</Table.HeadCell>
            <Table.HeadCell className="bg-green-100 sticky top-0 z-10">Guests (min / max)</Table.HeadCell>
            <Table.HeadCell className="bg-green-100 sticky top-0 z-10">Active</Table.HeadCell>
            <Table.HeadCell className="bg-green-100 sticky top-0 z-10 text-center">Actions</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={8} className="text-center py-10"><Spinner size="xl" /></Table.Cell>
              </Table.Row>
            ) : activities.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={8} className="text-center py-10 text-gray-500">No activities found.</Table.Cell>
              </Table.Row>
            ) : (
              activities.map(a => (
                <Table.Row key={a.id} className="bg-white">
                  <Table.Cell className="whitespace-nowrap text-xs font-mono uppercase text-gray-500">{a.type}</Table.Cell>
                  <Table.Cell className="font-bold text-green-900">{a.title}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap">{hhmm(a.openTime)}–{hhmm(a.closeTime)}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap">{a.durationMins} / {a.bufferMins} min</Table.Cell>
                  <Table.Cell className="whitespace-nowrap">{formatVND(a.basePrice)}</Table.Cell>
                  <Table.Cell className="whitespace-nowrap">{a.minGuests} / {a.maxCapacity}</Table.Cell>
                  <Table.Cell>
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${a.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {a.active ? 'Active' : 'Inactive'}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex justify-center space-x-2">
                      <Button size="xs" color="gray" title="Sessions"
                        onClick={() => navigate('/activity/sessions?activityId=' + encodeURIComponent(a.id || ''))}>
                        <HiCalendar className="h-4 w-4" />
                      </Button>
                      <Button size="xs" color="gray" onClick={() => handleEdit(a)}><HiPencil className="h-4 w-4" /></Button>
                      {canDelete && (
                        <Button size="xs" color="failure" onClick={() => setDeleting(a)}><HiTrash className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center space-x-3 text-sm">
          <Button size="xs" color="gray" disabled={pagination.pageNumber === 0} onClick={() => goToPage(pagination.pageNumber - 1)}>Prev</Button>
          <span>Page {pagination.pageNumber + 1} of {pagination.totalPages}</span>
          <Button size="xs" color="gray" disabled={pagination.pageNumber + 1 >= pagination.totalPages} onClick={() => goToPage(pagination.pageNumber + 1)}>Next</Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal show={openModal} size="3xl" onClose={() => setOpenModal(false)}>
        <Modal.Header>{editing.id ? "Edit Activity" : "Add Activity"}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field("type", "Type", <>
                <TextInput id="type" list="activity-types" placeholder="e.g. tour" value={editing.type}
                  onChange={(e) => set("type", e.target.value)} required />
                <datalist id="activity-types">
                  <option value="tour" />
                  <option value="cooking-class" />
                </datalist>
              </>)}
              {field("title", "Title", <TextInput id="title" value={editing.title}
                onChange={(e) => set("title", e.target.value)} required />)}
            </div>
            {field("description", "Description", <Textarea id="description" rows={2} value={editing.description || ""}
              onChange={(e) => set("description", e.target.value)} />)}
            {field("imageUrl", "Image URL", <TextInput id="imageUrl" value={editing.imageUrl || ""}
              onChange={(e) => set("imageUrl", e.target.value)} />)}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {field("openTime", "Opens", <TextInput id="openTime" type="time" value={editing.openTime}
                onChange={(e) => set("openTime", e.target.value)} />)}
              {field("closeTime", "Closes", <TextInput id="closeTime" type="time" value={editing.closeTime}
                onChange={(e) => set("closeTime", e.target.value)} />)}
              {field("durationMins", "Duration (min)", <TextInput id="durationMins" type="number" min={1}
                value={editing.durationMins} onChange={(e) => set("durationMins", num(e.target.value))} />)}
              {field("bufferMins", "Buffer (min)", <TextInput id="bufferMins" type="number" min={0}
                value={editing.bufferMins} onChange={(e) => set("bufferMins", num(e.target.value))} />)}
            </div>

            <div>
              <div className="mb-1 text-sm font-medium text-gray-900">Sessions per day</div>
              {slots.length === 0 ? (
                <div className="text-sm text-red-600">No session fits between the opening and closing times.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map(s => (
                    <span key={s.start} className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs text-green-800">
                      {s.start}–{s.end}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {field("basePrice", "Base price (VND/guest)", <TextInput id="basePrice" type="number" min={0}
                value={editing.basePrice} onChange={(e) => set("basePrice", num(e.target.value))} />)}
              {field("minGuests", "Min guests to confirm", <TextInput id="minGuests" type="number" min={1}
                value={editing.minGuests} onChange={(e) => set("minGuests", num(e.target.value))} />)}
              {field("maxCapacity", "Max capacity", <TextInput id="maxCapacity" type="number" min={1}
                value={editing.maxCapacity} onChange={(e) => set("maxCapacity", num(e.target.value))} />)}
              {field("defaultHostId", "Default host", <HostPicker id="defaultHostId" users={staffUsers}
                value={editing.defaultHostId || ""} onChange={(v) => set("defaultHostId", v)} />)}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Group discount tiers</span>
                <div className="flex space-x-2">
                  <Button size="xs" color="gray" onClick={addTier}><HiPlus className="mr-1 h-3 w-3" /> Tier</Button>
                  <Button size="xs" color="gray" onClick={() => set("pricingTiers", DEFAULT_TIERS.map(t => ({ ...t })))}>
                    Reset to defaults
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <Table.Head>
                    <Table.HeadCell>Min guests</Table.HeadCell>
                    <Table.HeadCell>Max guests</Table.HeadCell>
                    <Table.HeadCell>Discount %</Table.HeadCell>
                    <Table.HeadCell>Per guest</Table.HeadCell>
                    <Table.HeadCell />
                  </Table.Head>
                  <Table.Body className="divide-y">
                    {editing.pricingTiers.length === 0 && (
                      <Table.Row>
                        <Table.Cell colSpan={5} className="text-center text-sm text-gray-500">
                          No tiers: the default tiers are used when you save.
                        </Table.Cell>
                      </Table.Row>
                    )}
                    {editing.pricingTiers.map((t, i) => (
                      <Table.Row key={i}>
                        <Table.Cell>
                          <TextInput sizing="sm" type="number" min={1} value={t.minGuests}
                            onChange={(e) => setTier(i, { minGuests: num(e.target.value) })} />
                        </Table.Cell>
                        <Table.Cell>
                          <TextInput sizing="sm" type="number" min={1} placeholder="no limit" value={t.maxGuests ?? ""}
                            onChange={(e) => setTier(i, { maxGuests: e.target.value === "" ? null : Number(e.target.value) })} />
                        </Table.Cell>
                        <Table.Cell>
                          <TextInput sizing="sm" type="number" min={0} max={100} value={t.discountPct}
                            onChange={(e) => setTier(i, { discountPct: num(e.target.value) })} />
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap">{formatVND(tierUnitPrice(editing.basePrice, t.discountPct))}</Table.Cell>
                        <Table.Cell>
                          <Button size="xs" color="failure" onClick={() => removeTier(i)}><HiTrash className="h-3 w-3" /></Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="active" checked={editing.active} onChange={(e) => set("active", e.target.checked)} />
              <Label htmlFor="active" value="Active (bookable by guests)" />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="green" onClick={handleSave} disabled={saving}>
            {saving && <Spinner size="sm" className="mr-2" />} Save
          </Button>
          <Button color="gray" onClick={() => setOpenModal(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={deleting !== null} size="md" popup onClose={() => setDeleting(null)}>
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400" />
            <h3 className="mb-5 text-lg font-normal text-gray-500">
              Are you sure you want to delete <b>{deleting?.title}</b>?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={confirmDelete}>Yes, I'm sure</Button>
              <Button color="gray" onClick={() => setDeleting(null)}>No, cancel</Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
