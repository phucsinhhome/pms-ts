import { Expense } from "../Components/ExpenseManager"
import { getAccessToken } from "../App";

export const newExpId = () => {
  return '' + (Date.now() % 10000000)
}

const listLatestExpenses = async (pageNumber: number, pageSize: number) => {
  console.info("Fetching recent expenses")
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  };
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/list/recent?page=${pageNumber}&size=${pageSize}`, opts)
    .then(response => response.json())
}

export const listExpenseByDate = async (byDate: string, pageNumber: number, pageSize: number) => {
  console.info("Fetching expenses by date %s", byDate)
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  };
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/list/bydate?byDate=${byDate}&page=${pageNumber}&size=${pageSize}`, opts)
    .then(response => response.json())
}

export const listExpenseByExpenserAndDate = async (
  expenserId: string | null,
  byDate: string,
  pageNumber: number,
  pageSize: number
): Promise<any> => {
  console.info("Fetching %s expenses by date %s", expenserId, byDate)
  let url = `${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/list/bydate?byDate=${byDate}&page=${pageNumber}&size=${pageSize}`
  if (expenserId !== null && expenserId !== undefined && expenserId !== "") {
    url = `${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/list/bydate?expenserId=${expenserId}&byDate=${byDate}&page=${pageNumber}&size=${pageSize}`
  }
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  }
  return fetch(url, opts)
    .then(rsp => {
      if (!rsp.ok) {
        return []
      }
      return rsp.json()
    })
}

export default listLatestExpenses;

export async function getExpense(expenseId: string) {
  console.info("Fetching expense [%s] from backend with", expenseId)
  const accessToken = await getAccessToken();
  const opts: RequestInit = {
    method: 'GET',
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
  };
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/${expenseId}`, opts)
    .then(response => response.json())
}

export const saveExpense = async (expense: Expense) => {
  console.info("Saving expense %s...", expense.id)
  const accessToken = await getAccessToken();
  const opts = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(expense)
  }

  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/update`, opts)
}

export const deleteExpense = async (expense: Expense) => {
  console.info("Delete expense %s", expense.id)
  const accessToken = await getAccessToken();
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/delete`,
    {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify(expense)
    })
    .then(response => response.json())
}

export const generate = async (expenseTxt: string) => {
  console.info(`Generate expense ${expenseTxt}...`)
  const accessToken = await getAccessToken();
  const opts = {
    method: 'POST',
    headers: { 
      'Content-Type': 'text/plain',
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(expenseTxt)
  }

  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/generate`, opts)
}