import { AxiosResponse } from "axios";
import { taxPolicyApi } from "./apis";

export type TaxPolicy = {
  tenantId: string;
  id: string;
  name: string;
  order: number;
  enabled: boolean;
  taxRate: number;
  ruleExpression: string;
};

export const listTaxPolicies = (): Promise<AxiosResponse<TaxPolicy[]>> =>
  taxPolicyApi.get("");

export const createTaxPolicy = (policy: TaxPolicy): Promise<AxiosResponse<TaxPolicy>> =>
  taxPolicyApi.post("", policy);

export const updateTaxPolicy = (policy: TaxPolicy): Promise<AxiosResponse<TaxPolicy>> =>
  taxPolicyApi.put(`/${policy.id}`, policy);

export const reorderTaxPolicies = (policyIds: string[]): Promise<AxiosResponse<string[]>> =>
  taxPolicyApi.put("/order", policyIds);
