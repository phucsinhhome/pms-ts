import { Expense } from "../Components/ExpenseManager"

const requestOptions = {
  method: 'GET'
}

export const newExpId = () => {
  return '' + (Date.now() % 10000000)
}

const listLatestExpenses = (pageNumber: number, pageSize: number) => {
  console.info("Fetching recent expenses")
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/list/recent?page=${pageNumber}&size=${pageSize}`, requestOptions)
    .then(response => response.json())
}

export const listExpenseByDate = (byDate: string, pageNumber: number, pageSize: number) => {
  console.info("Fetching expenses by date %s", byDate)
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/list/bydate?byDate=${byDate}&page=${pageNumber}&size=${pageSize}`, requestOptions)
    .then(response => response.json())
}

export const listExpenseByExpenserAndDate = (expenserId: string | null, byDate: string, pageNumber: number, pageSize: number): Promise<any> => {
  console.info("Fetching %s expenses by date %s", expenserId, byDate)
  let url = `${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/list/bydate?byDate=${byDate}&page=${pageNumber}&size=${pageSize}`
  if (expenserId !== null && expenserId !== undefined && expenserId !== "") {
    url = `${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/list/bydate?expenserId=${expenserId}&byDate=${byDate}&page=${pageNumber}&size=${pageSize}`
  }
  const opts = {
    method: 'GET'
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

export function getExpense(expenseId: string) {
  console.info("Fetching expense [%s] from backend with", expenseId)
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/${expenseId}`, requestOptions)
    .then(response => response.json())
}

export const saveExpense = (expense: Expense) => {
  console.info("Saving expense %s...", expense.id)
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense)
  }

  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/update`, opts)
}

export const deleteExpense = (expense: Expense) => {
  console.info("Delete expense %s", expense.id)
  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/delete`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    })
    .then(response => response.json())
}

export const generate = (expenseTxt: string) => {
  console.info(`Generate expense ${expenseTxt}...`)
  var opts = {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(expenseTxt)
  }

  return fetch(`${process.env.REACT_APP_EXPENSE_SERVICE_ENDPOINT}/generate`, opts)
}