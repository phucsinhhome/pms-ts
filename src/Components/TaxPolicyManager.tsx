import React, { useEffect, useState } from "react";
import { Button, Label, Modal, Spinner, TextInput } from "flowbite-react";
import { FaCheckCircle, FaEdit, FaPlus, FaTimesCircle } from "react-icons/fa";
import { createTaxPolicy, listTaxPolicies, reorderTaxPolicies, TaxPolicy, updateTaxPolicy } from "../db/taxPolicy";

type TaxPolicyManagerProps = {
    activeMenu: () => void;
    handleUnauthorized: () => void;
    hasAuthority: (authority: string) => boolean;
};

const normalizePolicies = (policies: TaxPolicy[]) =>
    [...policies].sort((a, b) => a.order - b.order).map((policy, order) => ({ ...policy, order }));

const extractPolicies = (payload: unknown): TaxPolicy[] => {
    if (Array.isArray(payload)) return payload as TaxPolicy[];
    if (!payload || typeof payload !== "object") return [];
    const body = payload as { content?: unknown; data?: unknown; policies?: unknown };
    if (Array.isArray(body.content)) return body.content as TaxPolicy[];
    if (Array.isArray(body.policies)) return body.policies as TaxPolicy[];
    if (Array.isArray(body.data)) return body.data as TaxPolicy[];
    return [];
};

export const TaxPolicyManager = (props: TaxPolicyManagerProps) => {
    const [policies, setPolicies] = useState<TaxPolicy[]>([]);
    const [selectedId, setSelectedId] = useState<string>();
    const [editingPolicy, setEditingPolicy] = useState<TaxPolicy>();
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>();

    const loadPolicies = async () => {
        setLoading(true);
        setError(undefined);
        try {
            const response = await listTaxPolicies();
            if (response.status === 401 || response.status === 403) {
                props.handleUnauthorized();
                return;
            }
            if (response.status !== 200) throw new Error(`Tax policy API returned ${response.status}`);
            const data = normalizePolicies(extractPolicies(response.data));
            setPolicies(data);
            setSelectedId((current) => data.some((policy) => policy.id === current) ? current : data[0]?.id);
        } catch (e) {
            console.error("Unable to load tax policies", e);
            setError("Unable to load tax policies.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        props.activeMenu();
        loadPolicies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const moveSelected = async (direction: -1 | 1) => {
        const index = policies.findIndex((policy) => policy.id === selectedId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= policies.length || saving) return;

        const next = [...policies];
        [next[index], next[target]] = [next[target], next[index]];
        const requestedOrder = next.map((policy) => policy.id);
        setPolicies(next.map((policy, order) => ({ ...policy, order })));
        setSaving(true);
        try {
            const response = await reorderTaxPolicies(requestedOrder);
            if (response.status === 401 || response.status === 403) props.handleUnauthorized();
            if (response.status < 200 || response.status >= 300) throw new Error(`Tax API returned ${response.status}`);

            const responseOrder = Array.isArray(response.data) && response.data.length > 0
                ? response.data
                : requestedOrder;
            const policiesById = new Map(next.map((policy) => [policy.id, policy]));
            const orderedPolicies = responseOrder
                .map((policyId) => policiesById.get(policyId))
                .filter((policy): policy is TaxPolicy => policy !== undefined);
            const missingPolicies = next.filter((policy) => !responseOrder.includes(policy.id));
            setPolicies([...orderedPolicies, ...missingPolicies].map((policy, order) => ({ ...policy, order })));
        } catch (e) {
            console.error("Unable to reorder tax policies", e);
            setError("Unable to save the policy order.");
            loadPolicies();
        } finally {
            setSaving(false);
        }
    };

    const openCreateModal = () => {
        const nextOrder = policies.length;
        setIsCreating(true);
        setEditingPolicy({
            tenantId: policies[0]?.tenantId || "",
            id: "",
            name: "",
            order: nextOrder,
            enabled: true,
            taxRate: 0,
            ruleExpression: "",
        });
    };

    const closePolicyModal = () => {
        if (!saving) {
            setEditingPolicy(undefined);
            setIsCreating(false);
        }
    };

    const savePolicy = async () => {
        if (!editingPolicy || saving) return;
        setSaving(true);
        setError(undefined);
        try {
            const response = isCreating
                ? await createTaxPolicy(editingPolicy)
                : await updateTaxPolicy(editingPolicy);
            if (response.status === 401 || response.status === 403) {
                props.handleUnauthorized();
                return;
            }
            if (response.status < 200 || response.status >= 300) throw new Error(`Tax API returned ${response.status}`);
            if (isCreating) {
                await loadPolicies();
            } else {
                setPolicies((current) => normalizePolicies(current.map((policy) => policy.id === editingPolicy.id ? editingPolicy : policy)));
            }
            setEditingPolicy(undefined);
            setIsCreating(false);
        } catch (e) {
            console.error("Unable to update tax policy", e);
            setError("Unable to save the tax policy.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="relative flex h-[calc(100dvh-3rem)] flex-col">
            <div className="flex items-center justify-end border-b p-2">
                <Button size="sm" color="green" disabled={!props.hasAuthority("tax-policy:create") || loading || saving} onClick={openCreateModal}>
                    <FaPlus className="mr-2" /> Add tax policy
                </Button>
            </div>
            {error && <div className="p-2 text-sm text-red-700">{error}</div>}
            <div className="flex-1 overflow-y-auto pb-20">
                {loading ? <div className="flex justify-center p-8"><Spinner /></div> : policies.length === 0 ? <div className="p-8 text-center text-gray-500">No tax policies found.</div> : (
                    <div className="divide-y">
                        {policies.map((policy) => (
                            <div key={policy.id} className={`flex items-center gap-2 px-2 py-3 ${selectedId === policy.id ? "bg-green-100" : "hover:bg-green-50"}`}>
                                <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setSelectedId(policy.id)}>
                                    <span className="w-6 text-center font-mono text-sm text-gray-500">{policy.order + 1}</span>
                                    <span className="min-w-0 flex-1 truncate font-semibold text-green-900">{policy.name}</span>
                                    <span className="w-20 text-right text-sm font-medium">{(policy.taxRate * 100).toFixed(2)}%</span>
                                    <span className="w-7" title={policy.enabled ? "Enabled" : "Disabled"} aria-label={policy.enabled ? "Enabled" : "Disabled"}>
                                        {policy.enabled ? <FaCheckCircle className="text-green-600" /> : <FaTimesCircle className="text-gray-400" />}
                                    </span>
                                </button>
                                <Button size="xs" color="light" aria-label={`Edit ${policy.name}`} onClick={() => setEditingPolicy({ ...policy })}>
                                    <FaEdit className="mr-1" /> Edit
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-3xl bg-slate-200 p-2 shadow">
                <Button size="sm" color="light" disabled={saving || !selectedId || policies.findIndex((policy) => policy.id === selectedId) <= 0} onClick={() => moveSelected(-1)}>Move up</Button>
                <Button size="sm" color="light" disabled={saving || !selectedId || policies.findIndex((policy) => policy.id === selectedId) === -1 || policies.findIndex((policy) => policy.id === selectedId) >= policies.length - 1} onClick={() => moveSelected(1)}>Move down</Button>
            </div>
            <Modal show={!!editingPolicy} onClose={closePolicyModal}>
                <Modal.Header>{isCreating ? "Add tax policy" : "Edit tax policy"}</Modal.Header>
                <Modal.Body>
                    {editingPolicy && <div className="space-y-4">
                        <div><Label htmlFor="policy-name" value="Name" /><TextInput id="policy-name" value={editingPolicy.name} onChange={(e) => setEditingPolicy({ ...editingPolicy, name: e.target.value })} /></div>
                        <div><Label htmlFor="policy-rate" value="Tax rate" /><TextInput id="policy-rate" type="number" min="0" max="1" step="0.0001" value={editingPolicy.taxRate} onChange={(e) => setEditingPolicy({ ...editingPolicy, taxRate: Number(e.target.value) })} /><p className="text-xs text-gray-500">Enter a decimal value, for example 0.09 for 9%.</p></div>
                        <div><Label htmlFor="policy-rule" value="Rule expression" /><TextInput id="policy-rule" value={editingPolicy.ruleExpression} onChange={(e) => setEditingPolicy({ ...editingPolicy, ruleExpression: e.target.value })} /></div>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={editingPolicy.enabled} onChange={(e) => setEditingPolicy({ ...editingPolicy, enabled: e.target.checked })} /> Enabled</label>
                    </div>}
                </Modal.Body>
                <Modal.Footer><Button color="green" disabled={saving || !editingPolicy?.name.trim()} onClick={savePolicy}>Save</Button><Button color="gray" onClick={closePolicyModal}>Cancel</Button></Modal.Footer>
            </Modal>
        </div>
    );
};
