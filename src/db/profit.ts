import { PReport } from "../Components/ProfitReport"
import { getAccessToken } from "../App";

export const getProfitReportThisMonth = async (fromDate: string, toDate: string, reportKey: string) => {
  console.info("Fetching report from backend")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  };
  return fetch(`${process.env.REACT_APP_PROFIT_SERVICE_ENDPOINT}/report/${reportKey}?fromDate=${fromDate}&toDate=${toDate}`, opts)
    .then(response => response.json())
}

export async function fetchPReportThisMonth(fromDate: string, toDate: string, reportKey: string): Promise<PReport> {
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  };
  const response = await fetch(`${process.env.REACT_APP_PROFIT_SERVICE_ENDPOINT}/report/${reportKey}?fromDate=${fromDate}&toDate=${toDate}`, opts);
  const data = await response.json();
  return data;
}