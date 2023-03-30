import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getInvoice } from "../../db/invoice";
import { EditItem } from "./EditItem";
import UpdateButton from "../Button/Button";
import { TextInput, Label } from 'flowbite-react';

import { AddItem } from "./AddItem";
import { Table } from "flowbite-react";
import { SelectUser } from "../User/SelectUser";

export const EditInvoice = () => {
  const [invoice, setInvoice] = useState(
    {
      "id": "000000000000000000",
      "guestName": "",
      "issuer": "",
      "issuerId": "",
      "subTotal": 0,
      "items": [
        {
          "id": "",
          "itemName": "",
          "unitPrice": 0,
          "quantity": 0,
          "amount": 0,
          "service": "FOOD"
        }
      ]
    }
  )

  const { invoiceId } = useParams()

  useEffect(() => {
    console.info("Eding invoice %s", invoiceId)
    getInvoice(invoiceId).then(data => setInvoice(data))
  }, [invoiceId]);

  const handleSaveItem = (item) => {
    console.info("Item %s is updated", item.id)
    const nItems = invoice.items.map((i) => i.id === item.id ? item : i)

    var total = 0;
    for (var i in nItems) {
      total += nItems[i].amount;
    }

    const inv = {
      ...invoice,
      items: nItems,
      subTotal: total
    }

    setInvoice(inv)
  }

  const handleDeleteItem = (item) => {
    console.info("Item %s is deleted", item.id)
    const nItems = invoice.items.filter((it) => it.id !== item.id)
    let ta = nItems.map(({ amount }) => amount).reduce((a1, a2) => a1 + a2, 0)
    const inv = {
      ...invoice,
      items: nItems,
      subTotal: ta
    }

    setInvoice(inv)
  }


  const onDataChange = (e) => {
    const inv = {
      ...invoice,
      [e.target.id]: e.target.value
    }
    setInvoice(inv)
  }

  const onIssuerChange = (member) => {
    console.log("Selected issuer: %s", member.id)
    const inv = {
      ...invoice,
      issuerId: member.id,
      issuer: member.name
    }

    setInvoice(inv)
  }

  const handleSaveInvoice = () => {
    console.info("Saving invoice")
    console.log(invoice)
  }

  const handleAddItem = (addedItem) => {
    console.log("Added an item into invoice")
    console.log(addedItem)
    let items = [
      ...invoice.items,
      {
        id: addedItem.id,
        itemName: addedItem.name,
        unitPrice: addedItem.price,
        quantity: 1,
        amount: addedItem.price
      }
    ]
    let ta = items.map(({ amount }) => amount).reduce((a1, a2) => a1 + a2, 0)
    const inv = {
      ...invoice,
      items: items,
      subTotal: ta
    }
    setInvoice(inv)
  }

  return (
    <div class="bg-slate-50">
      <div class="py-2 px-2">
        <UpdateButton title="Save" disable={false} onClick={handleSaveInvoice} />
        <Link to=".." relative="path" >Back</Link>
      </div>
      <form class="flex flex-wrap mx-1">
        <div class="w-full md:w-1/2 px-1 mb-6">
          <div class="flex flex-wrap -mx-3 mb-6">
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="guestName"
                  value="Guest Name"
                />
              </div>
              <TextInput
                id="guestName"
                placeholder="John Smith"
                required={true}
                value={invoice.guestName}
                onChange={onDataChange}
              />
            </div>
          </div>
          <div class="flex flex-wrap -mx-3 mb-6">
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="checkInDate"
                  value="Check In"
                />
              </div>
              <TextInput
                id="checkInDate"
                placeholder="1"
                required={true}
                value={invoice.checkInDate}
                readOnly={false}
                type="date"
                onChange={onDataChange}
                rightIcon={() => {
                  return (
                    <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg>
                  )
                }}
              />
            </div>
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="checkOutDate"
                  value="Check Out"
                />
              </div>
              <TextInput
                id="checkOutDate"
                placeholder="1"
                required={true}
                value={invoice.checkOutDate}
                readOnly={false}
                type="date"
                rightIcon={() => {
                  return (
                    <svg aria-hidden="true" class="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path></svg>
                  )
                }}
              />
            </div>
          </div>

          <div class="flex flex-wrap -mx-3 mb-2">
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="issuer"
                  value="Issuer"
                />
              </div>
              <SelectUser initialUser={{ id: invoice.issuerId, name: invoice.issuer }}
                handleUserChange={onIssuerChange} />
            </div>
            <div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
              <div className="mb-2 block">
                <Label
                  htmlFor="totalAmount"
                  value="Total Amount"
                />
              </div>
              <TextInput
                id="totalAmount"
                placeholder="100000"
                required={true}
                value={invoice.subTotal}
                readOnly={true}
              />
            </div>
          </div>
        </div>
        {/** Second Column */}
        <div class="w-full md:w-1/2 px-1 mb-6">
          <Table hoverable={true}>
            <Table.Head>
              <Table.HeadCell>Item Name</Table.HeadCell>
              <Table.HeadCell>Unit Price</Table.HeadCell>
              <Table.HeadCell>Quantity</Table.HeadCell>
              <Table.HeadCell>Amount</Table.HeadCell>
              <Table.HeadCell>Service</Table.HeadCell>
              <Table.HeadCell>
                <span className="sr-only">
                  Edit
                </span>
              </Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {invoice.items.map((item) => {
                return (
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {item.itemName}
                    </Table.Cell>
                    <Table.Cell>
                      {item.unitPrice.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}
                    </Table.Cell>
                    <Table.Cell>
                      {item.quantity}
                    </Table.Cell>
                    <Table.Cell>
                      {item.amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}
                    </Table.Cell>
                    <Table.Cell>
                      {item.service}
                    </Table.Cell>
                    <Table.Cell>
                      {<EditItem eItem={item} onSave={handleSaveItem} onDelete={handleDeleteItem} />}
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>

          <div class="py-2 px-2">
            <AddItem fncAddItem={handleAddItem}></AddItem>
          </div>
        </div>
      </form>


    </div >
  );
}