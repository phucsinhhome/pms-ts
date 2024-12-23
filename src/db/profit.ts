import { PReport } from "../Components/ProfitReport"


const requestOptions = {
  method: 'GET',

}

export const getProfitReportThisMonth = (fromDate: string, toDate: string, reportKey: string) => {
  console.info("Fetching report from backend")
  return fetch(`${process.env.REACT_APP_PROFIT_SERVICE_ENDPOINT}/report/${reportKey}?fromDate=${fromDate}&toDate=${toDate}`, requestOptions)
    .then(response => response.json())
}

export async function fetchPReportThisMonth(fromDate: string, toDate: string, reportKey: string): Promise<PReport> {
  let opts = {
    method: 'GET'
  }
  const response = await fetch(`${process.env.REACT_APP_PROFIT_SERVICE_ENDPOINT}/report/${reportKey}?fromDate=${fromDate}&toDate=${toDate}`, opts);
  const data = await response.json();
  return data;
}