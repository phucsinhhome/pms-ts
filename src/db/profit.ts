import { PReport } from "../Components/ProfitReport"
import { reportApi } from "./apis";

export const getProfitReportThisMonth = async (fromDate: string, toDate: string, reportKey: string) => {
  console.info("Fetching report from backend")
  const response = await reportApi.get(
    `/report/${reportKey}`,
    { params: { fromDate, toDate } }
  );
  return response.data;
}

export async function fetchPReportThisMonth(fromDate: string, toDate: string, reportKey: string): Promise<PReport> {
  const response = await reportApi.get(
    `/report/${reportKey}`,
    { params: { fromDate, toDate } }
  );
  return response.data;
}