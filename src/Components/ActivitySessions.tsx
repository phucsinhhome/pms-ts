import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Label, Modal, Select, Table, Textarea, TextInput } from "flowbite-react";
import { HiArrowLeft, HiChevronLeft, HiChevronRight, HiLockClosed } from "react-icons/hi";
import {
  Activity,
  ActivitySessionView,
  addSessionRequest,
  assignSessionHost,
  decideRequest,
  listActivities,
  listSessions,
  sessionAction,
  SessionAction,
  SessionStatus,
  setSessionCapacity
} from "../db/activity";
import { addDays, formatLocalISODate, formatVND } from "../Service/Utils";
import { LoadingSpinner } from "./LoadingSpinner";
import { HostPicker, useStaffUsers } from "./ActivityManager";

type ActivitySessionsProps = {
  activeMenu: any,
  handleUnauthorized: any,
  hasAuthority: (auth: string) => boolean
}

const STATUS_STYLE: Record<SessionStatus, string> = {
  AVAILABLE: "bg-gray-100 text-gray-700",
  PENDING_CONFIRMATION: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800"
};

const STATUS_LABEL: Record<SessionStatus, string> = {
  AVAILABLE: "Available",
  PENDING_CONFIRMATION: "Pending confirmation",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled"
};

const isOpen = (s: ActivitySessionView) =>
  s.status === "AVAILABLE" || s.status === "PENDING_CONFIRMATION" || s.status === "CONFIRMED";

const emptyRequest = { guestName: "", invoiceId: "", partySize: 1, specialRequests: "" };

export function ActivitySessions(props: ActivitySessionsProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activityId = searchParams.get("activityId") || "";
  const [date, setDate] = useState<Date>(new Date());
  const [sessions, setSessions] = useState<ActivitySessionView[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const fetchSeq = useRef(0);
  const staffUsers = useStaffUsers();
  const canWrite = props.hasAuthority("activity:write");

  const [capacityFor, setCapacityFor] = useState<ActivitySessionView | null>(null);
  const [capacity, setCapacity] = useState(0);
  const [hostFor, setHostFor] = useState<ActivitySessionView | null>(null);
  const [host, setHost] = useState("");
  const [requestFor, setRequestFor] = useState<ActivitySessionView | null>(null);
  const [request, setRequest] = useState(emptyRequest);

  const fetchSessions = useCallback(async () => {
    const seq = ++fetchSeq.current;
    setLoading(true);
    try {
      const day = formatLocalISODate(date);
      const rsp = await listSessions(day, day, activityId || undefined);
      if (seq === fetchSeq.current) {
        setSessions(rsp.data || []);
      }
    } catch (e) {
      if (seq !== fetchSeq.current) return;
      setSessions([]);
      if (axios.isAxiosError(e) && (e.response?.status === 401 || e.response?.status === 403)) {
        props.handleUnauthorized();
      } else if (axios.isAxiosError(e) && e.response?.data?.message) {
        alert(e.response.data.message);
      } else {
        console.error("Error while fetching activity sessions", e);
      }
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, activityId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    props.activeMenu();
    (async () => {
      try {
        const rsp = await listActivities(0, 100);
        setActivities(rsp.data.content || []);
      } catch (e) {
        console.error("Error while fetching activities", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Runs one change; refreshes after success, and after a 409 since the session changed underneath us. */
  const runAction = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    try {
      await fn();
      fetchSessions();
      return true;
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const status = e.response?.status;
        const message = e.response?.data?.message;
        if (status === 401 || status === 403) {
          props.handleUnauthorized();
          return false;
        }
        if (status === 409) {
          alert(message ?? "The session changed; refreshing");
          fetchSessions();
          return false;
        }
        if (status === 400 || status === 404) {
          alert(message ?? "Request failed");
          return false;
        }
      }
      console.error("Activity session action failed", e);
      alert("Request failed");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const act = (s: ActivitySessionView, action: SessionAction, question?: string) => {
    if (question && !window.confirm(question)) return;
    runAction(() => sessionAction(s.sessionId, action));
  };

  const saveCapacity = async () => {
    if (!capacityFor) return;
    if (await runAction(() => setSessionCapacity(capacityFor.sessionId, capacity))) setCapacityFor(null);
  };

  const saveHost = async () => {
    if (!hostFor) return;
    if (await runAction(() => assignSessionHost(hostFor.sessionId, host.trim()))) setHostFor(null);
  };

  const saveRequest = async () => {
    if (!requestFor) return;
    const body = {
      guestName: request.guestName.trim(),
      invoiceId: request.invoiceId.trim() || undefined,
      partySize: Number(request.partySize),
      specialRequests: request.specialRequests.trim() || undefined
    };
    if (await runAction(() => addSessionRequest(requestFor.sessionId, body))) setRequestFor(null);
  };

  const changeActivity = (id: string) => setSearchParams(id ? { activityId: id } : {});

  return (
    <div className="p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Button size="xs" color="gray" onClick={() => navigate("/activity")}><HiArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-xl sm:text-2xl font-bold text-green-900">Activity Sessions</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select sizing="sm" value={activityId} onChange={(e) => changeActivity(e.target.value)}>
            <option value="">All active activities</option>
            {activities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </Select>
          <Button size="xs" color="gray" onClick={() => setDate(prev => addDays(prev, -1))}><HiChevronLeft className="h-4 w-4" /></Button>
          <Button size="xs" color="gray" onClick={() => setDate(new Date())}>Today</Button>
          <span className="font-semibold text-green-900">{formatLocalISODate(date)}</span>
          <Button size="xs" color="gray" onClick={() => setDate(prev => addDays(prev, 1))}><HiChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><LoadingSpinner /></div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No sessions on this day.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
          {sessions.map(s => (
            <Card key={s.sessionId}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-bold text-green-900">
                    {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)} · {s.activityTitle}
                  </div>
                  <div className="text-xs font-mono uppercase text-gray-500">{s.activityType}</div>
                </div>
                <div className="flex items-center gap-1">
                  {s.locked && <HiLockClosed className="h-4 w-4 text-gray-600" title="Locked" />}
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                <div>Guests: <b>{s.headcount} / {s.maxCapacity}</b>{s.full && <span className="ml-1 text-red-600 font-semibold">Full</span>}</div>
                <div>Approved: <b>{s.approvedHeadcount}</b> / {s.minGuests} to confirm</div>
                <div>Price now: <b>{formatVND(s.currentUnitPrice)}</b>/guest</div>
                <div>If all approved: <b>{formatVND(s.projectedUnitPrice)}</b>/guest</div>
                <div className="col-span-2">Host: <b>{s.hostId || "—"}</b></div>
              </div>

              {s.requests.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <Table.Head>
                      <Table.HeadCell>Guest</Table.HeadCell>
                      <Table.HeadCell>Invoice</Table.HeadCell>
                      <Table.HeadCell>Party</Table.HeadCell>
                      <Table.HeadCell>Requests</Table.HeadCell>
                      <Table.HeadCell>Status</Table.HeadCell>
                      {s.status === "COMPLETED" && <Table.HeadCell>Price</Table.HeadCell>}
                      {canWrite && <Table.HeadCell />}
                    </Table.Head>
                    <Table.Body className="divide-y">
                      {s.requests.map(r => (
                        <Table.Row key={r.requestId}>
                          <Table.Cell className="whitespace-nowrap">{r.guestName || "—"}</Table.Cell>
                          <Table.Cell className="whitespace-nowrap text-xs">{r.invoiceId || "walk-in"}</Table.Cell>
                          <Table.Cell>{r.partySize}</Table.Cell>
                          <Table.Cell className="text-xs">{r.specialRequests || ""}</Table.Cell>
                          <Table.Cell className="text-xs font-semibold">{r.status}</Table.Cell>
                          {s.status === "COMPLETED" && (
                            <Table.Cell className="whitespace-nowrap">{r.lockedUnitPrice != null ? formatVND(r.lockedUnitPrice) : ""}</Table.Cell>
                          )}
                          {canWrite && (
                            <Table.Cell>
                              {r.status === "PENDING" && isOpen(s) && (
                                <div className="flex gap-1">
                                  <Button size="xs" color="green" disabled={busy}
                                    onClick={() => runAction(() => decideRequest(s.sessionId, r.requestId, "approve"))}>Approve</Button>
                                  <Button size="xs" color="failure" disabled={busy}
                                    onClick={() => runAction(() => decideRequest(s.sessionId, r.requestId, "reject"))}>Reject</Button>
                                </div>
                              )}
                            </Table.Cell>
                          )}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </div>
              )}

              {canWrite && isOpen(s) && (
                <div className="flex flex-wrap gap-2">
                  {s.locked
                    ? <Button size="xs" color="gray" disabled={busy} onClick={() => act(s, "unlock")}>Unlock</Button>
                    : <Button size="xs" color="gray" disabled={busy} onClick={() => act(s, "lock")}>Lock</Button>}
                  <Button size="xs" color="gray" disabled={busy}
                    onClick={() => { setCapacity(s.maxCapacity); setCapacityFor(s); }}>Capacity</Button>
                  <Button size="xs" color="gray" disabled={busy}
                    onClick={() => { setHost(s.hostId || ""); setHostFor(s); }}>Host</Button>
                  {!s.locked && (
                    <Button size="xs" color="gray" disabled={busy}
                      onClick={() => { setRequest(emptyRequest); setRequestFor(s); }}>Add request</Button>
                  )}
                  {s.status === "PENDING_CONFIRMATION" && (
                    <Button size="xs" color="green" disabled={busy} onClick={() => act(s, "confirm")}>Confirm</Button>
                  )}
                  {s.status === "CONFIRMED" && (
                    <Button size="xs" color="blue" disabled={busy}
                      onClick={() => act(s, "complete", "Complete this session? Approved guests' prices are fixed and pending requests are cancelled.")}>
                      Complete
                    </Button>
                  )}
                  {(s.status === "PENDING_CONFIRMATION" || s.status === "CONFIRMED") && (
                    <Button size="xs" color="failure" disabled={busy}
                      onClick={() => act(s, "cancel", "Cancel this session and all its requests?")}>Cancel</Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal show={capacityFor !== null} size="sm" onClose={() => setCapacityFor(null)}>
        <Modal.Header>Capacity</Modal.Header>
        <Modal.Body>
          <Label htmlFor="sessionCapacity" value={`Maximum guests (currently ${capacityFor?.headcount ?? 0} booked)`} />
          <TextInput id="sessionCapacity" type="number" min={1} value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))} />
        </Modal.Body>
        <Modal.Footer>
          <Button color="green" disabled={busy} onClick={saveCapacity}>Save</Button>
          <Button color="gray" onClick={() => setCapacityFor(null)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={hostFor !== null} size="sm" onClose={() => setHostFor(null)}>
        <Modal.Header>Host</Modal.Header>
        <Modal.Body>
          <Label htmlFor="sessionHost" value="Staff username" />
          <HostPicker id="sessionHost" users={staffUsers} value={host} onChange={setHost} />
        </Modal.Body>
        <Modal.Footer>
          <Button color="green" disabled={busy} onClick={saveHost}>Save</Button>
          <Button color="gray" onClick={() => setHostFor(null)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={requestFor !== null} size="md" onClose={() => setRequestFor(null)}>
        <Modal.Header>Add request</Modal.Header>
        <Modal.Body>
          <div className="space-y-3">
            <div>
              <Label htmlFor="reqGuest" value="Guest name" />
              <TextInput id="reqGuest" value={request.guestName}
                onChange={(e) => setRequest({ ...request, guestName: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="reqInvoice" value="Invoice id (optional)" />
              <TextInput id="reqInvoice" value={request.invoiceId}
                onChange={(e) => setRequest({ ...request, invoiceId: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="reqParty" value="Party size" />
              <TextInput id="reqParty" type="number" min={1} value={request.partySize}
                onChange={(e) => setRequest({ ...request, partySize: Number(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="reqSpecial" value="Special requests" />
              <Textarea id="reqSpecial" rows={2} value={request.specialRequests}
                onChange={(e) => setRequest({ ...request, specialRequests: e.target.value })} />
            </div>
            <p className="text-xs text-gray-500">Requests added by staff are approved immediately.</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="green" disabled={busy} onClick={saveRequest}>Add</Button>
          <Button color="gray" onClick={() => setRequestFor(null)}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
