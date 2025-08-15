import { Expense } from "../Components/ExpenseManager"
import { expenseApi } from "./apis";

export const newExpId = () => {
  return '' + (Date.now() % 10000000)
}

export const listLatestExpenses = async (pageNumber: number, pageSize: number) => {
  console.info("Fetching recent expenses")

  return await expenseApi.get(
    `/list/recent`,
    { params: { page: pageNumber, size: pageSize } }
  );
}

export const listExpenseByDate = async (byDate: string, pageNumber: number, pageSize: number) => {
  console.info("Fetching expenses by date %s", byDate)

  return await expenseApi.get(
    `/list/bydate`,
    { params: { byDate, page: pageNumber, size: pageSize } }
  );
}

export const listExpenseByExpenserAndDate = (
  expenserId: string | null,
  byDate: string,
  pageNumber: number,
  pageSize: number
): Promise<any> => {
  console.info("Fetching %s expenses by date %s", expenserId, byDate)
  const params: any = { byDate, page: pageNumber, size: pageSize };
  if (expenserId !== null && expenserId !== undefined && expenserId !== "") {
    params.expenserId = expenserId;
  }

  return expenseApi.get(
    `/list/bydate`,
    { params }
  );
}

export async function getExpense(expenseId: string) {
  console.info("Fetching expense [%s] from backend with", expenseId)

  return await expenseApi.get(`/${expenseId}`);
}

export const saveExpense = async (expense: Expense) => {
  console.info("Saving expense %s...", expense.id)
  return expenseApi.post(
    `/update`,
    expense,
    { headers: { 'Content-Type': 'application/json' } }
  );
}

export const deleteExpense = async (expense: Expense) => {
  console.info("Delete expense %s", expense.id)
  return expenseApi.delete(
    `/delete`,
    {
      headers: { 'Content-Type': 'application/json' },
      data: expense
    }
  );
}

export const generate = async (expenseTxt: string) => {
  console.info(`Generate expense ${expenseTxt}...`)
  return expenseApi.post(
    `/generate`,
    expenseTxt,
    { headers: { 'Content-Type': 'text/plain' } }
  );
}