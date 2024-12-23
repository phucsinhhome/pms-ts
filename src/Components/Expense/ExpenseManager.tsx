import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { useLocation } from "react-router-dom";
import { Table, TextInput, Label, Spinner, Modal, Button } from "flowbite-react";
import { deleteExpense, newExpId } from "../../db/expense";
import Moment from "react-moment";
import run from "../../Service/ExpenseExtractionService";
import { classifyServiceByItemName } from "../../Service/ItemClassificationService";
import { Chat, DEFAULT_PAGE_SIZE } from "../../App";
import { HiOutlineCash } from "react-icons/hi";
import { formatISODate, formatISODateTime, formatMoneyAmount, formatVND } from "../../Service/Utils";
import { PiBrainThin } from "react-icons/pi";
import { FaRotate } from "react-icons/fa6";
import { listExpenseByExpenserAndDate } from "../../db/expense";
import { Pagination } from "../Profit/Models";
import { saveExpense } from "../../db/expense";

export type Expense = {
  id: string,
  expenseDate: string,
  itemName: string,
  quantity: number,
  unitPrice: number,
  amount: number,
  expenserName: string,
  expenserId: string,
  service: string
}

type EditingExpense = {
  origin: Expense,
  formattedUnitPrice: string,
  itemMessage: string,
  originItemName: string
}

const defaultEmptExpense = {
  id: '',
  expenseDate: formatISODateTime(new Date()),
  itemName: "",
  quantity: 1,
  unitPrice: 0,
  amount: 0,
  expenserName: 'Minh Tran',
  expenserId: '1351151927',
  service: ""
}

const defaultEditingExpense = {
  origin: defaultEmptExpense,
  formattedUnitPrice: "",
  originItemName: "",
  itemMessage: ""
}

type ExpenseProps = {
  chat: Chat,
  authorizedUserId: string | null,
  displayName: string
}

export const ExpenseManager = (props: ExpenseProps) => {

  const [expenses, setExpenses] = useState([defaultEmptExpense])
  const [generatingExp, setGeneratingExp] = useState(false);
  const [classifyingExp, setClassifyingExp] = useState(false);

  const [openDelExpenseModal, setOpenDelExpenseModal] = useState(false)
  const [deletingExpense, setDeletingExpense] = useState<Expense>()

  const [openEditingExpenseModal, setOpenEditingExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<EditingExpense>(defaultEditingExpense)

  const [pagination, setPagination] = useState<Pagination>({
    pageNumber: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalElements: 200,
    totalPages: 20
  })

  const expMsgRef = useRef<HTMLInputElement>(null)

  const handlePaginationClick = (pageNumber: number) => {
    console.log("Pagination nav bar click to page %s", pageNumber)
    fetchData(pageNumber < 0 ? 0 : pageNumber > pagination.totalPages - 1 ? pagination.totalPages - 1 : pageNumber, pagination.pageSize)
  }

  const location = useLocation()


  const fetchData = (pageNumber: number, pageSize: number) => {
    let byDate = formatISODate(new Date())
    // let expenserId = (initialUser !== null && initialUser !== undefined) ? initialUser.id : null
    return listExpenseByExpenserAndDate(props.authorizedUserId, byDate, pageNumber, pageSize)
      .then((data: any) => {
        if(data ===undefined){
          console.warn("Invalid expense response")
          return 
        }
        let sortedExps = data.content
        setExpenses(sortedExps)
        setPagination({
          pageNumber: data.number,
          pageSize: data.size,
          totalElements: data.totalElements,
          totalPages: data.totalPages
        })
        return true
      })
  }

  useEffect(() => {
    console.log(location)
    fetchData(location.state.pageNumber, location.state.pageSize)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const pageClass = (pageNum: number) => {
    var noHighlight = "px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
    var highlight = "px-3 py-2 leading-tight text-bold text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"

    return pagination.pageNumber === pageNum ? highlight : noHighlight
  }

  const generateExpenseFromMessage = (msg: string) => {
    return run(msg)
      .then(data => {
        console.info("Complete extracting expense from message %s", msg);
        console.info(data);
        let jsonD = JSON.parse(data)

        let eE = jsonD.expenses[0]

        let pr = parseInt(eE.price);
        let qty = parseInt(eE.quantity);
        let uP = Math.floor(pr / qty); // Use Math.floor() if you prefer rounding down
        console.info("Price: " + pr + ", Quantity: " + qty + ", Unit Price: " + uP)
        var exp = {
          id: '',
          itemName: eE.item,
          quantity: qty,
          unitPrice: uP,
          amount: pr,
          service: eE.service,
          expenseDate: formatISODateTime(new Date()),
          expenserName: props.displayName,
          expenserId: props.chat.id
        }
        return exp
      })
  }

  const handleDeleteExpense = (exp: Expense) => {
    console.warn("Deleting expense [%s]...", exp.id)
    deleteExpense(exp)
      .then((rsp: any) => {
        if (rsp !== null) {
          console.log("Delete expense %s successully", exp.id)
          fetchData(location.state.pageNumber, location.state.pageSize)
        }
      })
  }

  //============ EXPENSE DELETION ====================//
  const askForDelExpenseConfirmation = (exp: Expense) => {
    setDeletingExpense(exp);
    setOpenDelExpenseModal(true)
  }

  const cancelDelExpense = () => {
    setOpenDelExpenseModal(false)
    setDeletingExpense(undefined)
  }

  const confirmDelExpense = () => {
    try {
      if (deletingExpense === undefined || deletingExpense === null) {
        return;
      }
      handleDeleteExpense(deletingExpense)
    } catch (e) {
      console.error(e)
    } finally {
      setOpenDelExpenseModal(false)
      setDeletingExpense(undefined)
    }

  }

  //================= EDIT EXPENSE ===================//
  const editExpense = (exp: Expense) => {
    let uP = formatMoneyAmount(String(exp.unitPrice))
    let eI = {
      origin: exp,
      formattedUnitPrice: uP.formattedAmount,
      originItemName: exp.itemName,
      itemMessage: ""
    }
    setEditingExpense(eI)
    setOpenEditingExpenseModal(true)
  }

  const cancelEditingExpense = () => {
    fetchData(pagination.pageNumber, pagination.pageSize)
      .then((res: any) => {
        setEditingExpense(defaultEditingExpense)
        setOpenEditingExpenseModal(false)
      })
  }

  const changeItemMessage = (e: ChangeEvent<HTMLInputElement>) => {
    let iMsg = e.target.value
    let eI = {
      ...editingExpense,
      itemMessage: iMsg
    }
    setEditingExpense(eI)
  }

  const changeItemName = (e: ChangeEvent<HTMLInputElement>) => {
    let iName = e.target.value
    let eI = {
      ...editingExpense,
      itemName: iName
    }
    setEditingExpense(eI)
  }

  const changeService = (e: ChangeEvent<HTMLInputElement>) => {
    let iName = e.target.value
    let eI = {
      ...editingExpense,
      service: iName
    }
    setEditingExpense(eI)
  }

  const blurItemName = () => {
    let nItemName = editingExpense.origin.itemName
    if (nItemName === null || nItemName === undefined || nItemName === "") {
      return;
    }
    setClassifyingExp(true)
    console.log("Classify the service by expense name [%s]", nItemName)
    classifyServiceByItemName(nItemName)
      .then((srv) => {
        var nexItem = {
          ...editingExpense,
          service: srv
        }
        setEditingExpense(nexItem)
        setClassifyingExp(false)
      })
  }

  const changeUnitPrice = (e: ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value
    let uP = formatMoneyAmount(v)
    let eI = {
      ...editingExpense,
      amount: uP.amount * editingExpense.origin.quantity,
      unitPrice: uP.amount,
      formattedUnitPrice: uP.formattedAmount
    }
    setEditingExpense(eI)
  }

  const changeQuantity = (delta: number) => {
    let nQ = editingExpense.origin.quantity + delta
    let eI = {
      ...editingExpense,
      quantity: nQ,
      amount: editingExpense.origin.unitPrice * nQ
    }
    setEditingExpense(eI)
  }

  const generatePopupExpense = () => {
    let expMsg = editingExpense.itemMessage
    console.info("Extracting expense from message %s", expMsg)
    if (expMsg.length < 5) {
      console.warn("Message must be longer than 5 characters")
      return
    }
    setGeneratingExp(true)
    generateExpenseFromMessage(expMsg)
      .then(exp => {
        let uP = formatMoneyAmount(String(exp.unitPrice))
        let eI = {
          origin: exp,
          formattedUnitPrice: uP.formattedAmount,
          originItemName: exp.itemName,
          itemMessage: expMsg
        }
        setEditingExpense(eI)
        setGeneratingExp(false)
      })
      .catch(e => {
        console.error("Failed to generate expcetion from %s", expMsg, e)
      })
      .finally(() => {
        setGeneratingExp(false)
      })
  }

  const processSaveExpense = () => {
    let exp = {
      expenseDate: editingExpense.origin.expenseDate,
      itemName: editingExpense.origin.itemName,
      quantity: editingExpense.origin.quantity,
      unitPrice: editingExpense.origin.unitPrice,
      expenserId: props.chat.id,
      expenserName: props.displayName,
      service: editingExpense.origin.service,
      id: editingExpense.origin.id,
      amount: editingExpense.origin.amount
    }
    if (exp.id === null || exp.id === "" || exp.id === "new") {
      exp.id = newExpId()
      console.info("Generated the expense id %s", exp.id)
    }
    if (exp.expenseDate === null) {
      let expDate = formatISODateTime(new Date())
      exp.expenseDate = expDate
      console.info("Updated expense date to %s", expDate)
    }
    if (exp.expenserId === null) {
      exp.expenserId = props.chat.id
      exp.expenserName = props.displayName
      console.info("Updated expenser to %s", props.chat.id)
    }
    console.info("Save expense %s...", exp.id)
    return saveExpense(exp)
      .then((rsp: Response) => rsp.ok)
  }

  const handleSaveAndCompleteExpense = () => {
    processSaveExpense()
      .then((result: boolean) => {
        if (result) {
          setEditingExpense(defaultEditingExpense)
          cancelEditingExpense()
        } else {
          console.error("Failed to save expense")
        }
      })
  }

  const handleSaveAndContinueExpense = () => {

    processSaveExpense()
      .then((result: boolean) => {
        if (result) {
          setEditingExpense(defaultEditingExpense)
          if (expMsgRef.current === null) {
            return
          }
          expMsgRef.current.focus()
        } else {
          console.error("Failed to save expense")
        }
      })
  }

  return (
    <div className="h-full pt-3">
      <div className="flex flex-row px-2">
        <div className="flex flex-row items-center pl-4 pb-2">
          <svg
            className="w-5 h-5 text-amber-700 dark:text-white"
            aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" />
          </svg>
          <span
            onClick={() => editExpense(defaultEmptExpense)}
            className="font-bold text-amber-800"
          >
            Add Expense
          </span>
        </div>
      </div>
      <div className="h-3/5 max-h-fit overflow-hidden">
        <Table hoverable={true}>
          <Table.Head>
            <Table.HeadCell className="sm:px-1">
              Date
            </Table.HeadCell>
            <Table.HeadCell className="sm:px-1">
              Details
            </Table.HeadCell>

            <Table.HeadCell>
              <span className="sr-only">
                Delete
              </span>
            </Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y" >
            {expenses.map((exp) => {
              return (
                <Table.Row
                  className="bg-white"
                  key={exp.id}
                >
                  <Table.Cell className="sm:px-1 pr-1 py-0.5">
                    <Moment format="DD.MM">{new Date(exp.expenseDate)}</Moment>
                  </Table.Cell>
                  <Table.Cell className="sm:px-1 py-0.5">
                    <div className="grid grid-cols-1">
                      <Label
                        onClick={() => editExpense(exp)}
                        // state={{ pageNumber: pagination.pageNumber, pageSize: pagination.pageSize }}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-500"
                        value={exp.itemName}
                      />
                      <div className="flex flex-row text-sm space-x-1">
                        <div className="w-24">
                          <span>{formatVND(exp.amount)}</span>
                        </div>

                        <span className="font font-mono font-black w-20">{exp.service}</span>
                        <span className="font font-mono font-thin text-gray-320 italic">{props.authorizedUserId !== null ? "" : exp.expenserId}</span>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell className=" py-0.5">
                    <svg
                      className="w-6 h-6 text-red-800 dark:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24" fill="none" viewBox="0 0 24 24"
                      onClick={() => askForDelExpenseConfirmation(exp)}
                    >
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
                    </svg>

                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </div>
      <nav className="flex items-center justify-between pt-4" aria-label="Table navigation">
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">Showing <span className="font-semibold text-gray-900 dark:text-white">{pagination.pageSize * pagination.pageNumber + 1}-{pagination.pageSize * pagination.pageNumber + pagination.pageSize}</span> of <span className="font-semibold text-gray-900 dark:text-white">{pagination.totalElements}</span></span>
        <ul className="inline-flex items-center -space-x-px">
          <li onClick={() => handlePaginationClick(pagination.pageNumber - 1)} className="block px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
          </li>
          <li onClick={() => handlePaginationClick(0)} className={pageClass(0)}>
            1
          </li>
          <li hidden={pagination.pageNumber + 1 <= 1 || pagination.pageNumber + 1 >= pagination.totalPages} aria-current="page" className={pageClass(pagination.pageNumber)}>
            {pagination.pageNumber + 1}
          </li>
          <li hidden={pagination.totalPages <= 1} onClick={() => handlePaginationClick(pagination.totalPages - 1)} className={pageClass(pagination.totalPages - 1)}>
            {pagination.totalPages}
          </li>
          <li onClick={() => handlePaginationClick(pagination.pageNumber + 1)} className="block px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
            <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
          </li>
        </ul>
      </nav>


      <Modal show={openDelExpenseModal} onClose={cancelDelExpense}>
        <Modal.Header>Confirm</Modal.Header>
        <Modal.Body>
          <div>
            <span>{deletingExpense === null ? "" : "Are you sure to delete [" + deletingExpense?.itemName + "]?"}</span>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-center gap-4">
          <Button onClick={confirmDelExpense}>Delete</Button>
          <Button color="gray" onClick={cancelDelExpense}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={openEditingExpenseModal}
        size="md"
        popup={true}
        onClose={cancelEditingExpense}
        initialFocus={expMsgRef}
      >
        <Modal.Header />
        <Modal.Body>
          <div className="space-y-6 px-6 pb-4 sm:pb-6 lg:px-8 xl:pb-8">
            <div className="flex flex-col w-full">
              <TextInput
                id="itemMsg"
                placeholder="3 ổ bánh mì 6k"
                required={true}
                value={editingExpense.itemMessage}
                onChange={changeItemMessage}
                className="w-full"
                rightIcon={() => generatingExp ?
                  <Spinner aria-label="Default status example"
                    className="w-14 h-10"
                  />
                  : <PiBrainThin
                    onClick={() => generatePopupExpense()}
                    className="pointer-events-auto cursor-pointer w-14 h-10"
                  />
                }
                ref={expMsgRef}
              />
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="itemName"
                  value="Item Name"
                />
              </div>
              <TextInput
                id="itemName"
                placeholder="Bánh mì"
                required={true}
                value={editingExpense.origin.itemName}
                onChange={changeItemName}
                onBlur={blurItemName}
                className="w-full"
              />
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="unitPrice"
                  value="Unit Price"
                />
              </div>
              <TextInput
                id="unitPrice"
                placeholder="Enter amount here"
                type="currency"
                step={5000}
                required={true}
                value={editingExpense.formattedUnitPrice}
                onChange={changeUnitPrice}
                rightIcon={HiOutlineCash}
                className="w-full"
              />
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="quantity"
                  value="Quantity"
                />
              </div>
              <div className="relative flex items-center w-full">
                <button
                  type="button"
                  id="decrement-button"
                  data-input-counter-decrement="quantity-input"
                  className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-s-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                  onClick={() => changeQuantity(-1)}
                >
                  <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 2">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h16" />
                  </svg>
                </button>
                <input
                  type="number"
                  id="quantity-input"
                  data-input-counter aria-describedby="helper-text-explanation"
                  className="bg-gray-50 border-x-0 border-gray-300 h-11 text-center text-gray-900 text-sm focus:ring-blue-500 focus:border-blue-500 block w-full py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="999"
                  required
                  value={editingExpense.origin.quantity}
                  readOnly
                />
                <button
                  type="button"
                  id="increment-button"
                  data-input-counter-increment="quantity-input"
                  className="bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 hover:bg-gray-200 border border-gray-300 rounded-e-lg p-3 h-11 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                  onClick={() => changeQuantity(1)}
                >
                  <svg className="w-3 h-3 text-gray-900 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 1v16M1 9h16" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="amount"
                  value="Amount"
                />
              </div>
              <span className="w-full">{formatVND(editingExpense.origin.amount)}</span>

            </div>
            <div className="flex flex-row w-full align-middle">
              <div className="flex items-center w-2/5">
                <Label
                  htmlFor="service"
                  value="Service"
                />
              </div>
              <TextInput
                id="service"
                placeholder="STAY TOUR or FOOD"
                value={editingExpense.origin.service}
                readOnly
                required
                onChange={changeService}
                rightIcon={() => classifyingExp ?
                  <Spinner aria-label="Default status example"
                    className="w-8 h-8"
                  /> :
                  <FaRotate
                    onClick={blurItemName}
                    className="pointer-events-auto cursor-pointer w-10 h-8"
                  />
                }
                className="w-full"
              />
            </div>
            <div className="w-full flex justify-center">
              <Button onClick={handleSaveAndCompleteExpense} className="mx-2">
                Save & Close
              </Button>
              <Button onClick={handleSaveAndContinueExpense} className="mx-2">
                Save & Continue
              </Button>
              <Button onClick={cancelEditingExpense} className="mx-2">
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div >
  );
}
