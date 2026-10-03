import { activityApi } from "./apis";

export type PricingTier = { minGuests: number; maxGuests: number | null; discountPct: number };

export type Activity = {
  id?: string;
  tenantId?: string;
  type: string;
  title: string;
  description?: string;
  imageUrl?: string;
  durationMins: number;
  bufferMins: number;
  openTime: string;   // "HH:mm" (the server may send "HH:mm:ss")
  closeTime: string;
  basePrice: number;
  minGuests: number;
  maxCapacity: number;
  defaultHostId?: string;
  pricingTiers: PricingTier[];
  active: boolean;
};

export const DEFAULT_TIERS: PricingTier[] = [
  { minGuests: 1, maxGuests: 2, discountPct: 0 },
  { minGuests: 3, maxGuests: 5, discountPct: 15 },
  { minGuests: 6, maxGuests: 10, discountPct: 30 },
  { minGuests: 11, maxGuests: null, discountPct: 40 },
];

const json = { headers: { 'Content-Type': 'application/json' } };

export const listActivities = (page: number, size: number) => activityApi.get('', { params: { page, size } });

export const getActivity = (id: string) => activityApi.get(`/${encodeURIComponent(id)}`);

export const createActivity = (a: Activity) => activityApi.put('', a, json);

export const updateActivity = (a: Activity) => activityApi.post(`/${encodeURIComponent(a.id || '')}`, a, json);

export const deleteActivity = (id: string) => activityApi.delete(`/${encodeURIComponent(id)}`);

const toMinutes = (hhmm: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

const toHHmm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** Display-only mirror of the server's ActivitySlotGenerator (the server is authoritative). */
export const previewSlots = (a: Pick<Activity, 'openTime' | 'closeTime' | 'durationMins' | 'bufferMins'>): { start: string; end: string }[] => {
  const open = toMinutes(a.openTime);
  const close = toMinutes(a.closeTime);
  const duration = Number(a.durationMins);
  const buffer = Number(a.bufferMins);
  if (open === null || close === null || open >= close || !(duration >= 1) || !(buffer >= 0)) {
    return [];
  }
  const slots: { start: string; end: string }[] = [];
  // int minutes of the day, so the loop cannot wrap at midnight
  for (let m = open; m + duration <= close; m += duration + buffer) {
    slots.push({ start: toHHmm(m), end: toHHmm(m + duration) });
  }
  return slots;
};

/** Per-guest price for a tier, matching the server: round(base * (100 - pct) / 100). */
export const tierUnitPrice = (basePrice: number, discountPct: number) =>
  Math.round((Number(basePrice) || 0) * (100 - (Number(discountPct) || 0)) / 100);
