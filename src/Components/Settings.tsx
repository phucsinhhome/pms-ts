import { formatDatePartition } from "../Service/Utils";
import { syncStatusOfMonth } from "../Service/StatusSyncingService";
import React, { ChangeEvent, useEffect, useState } from "react";
import { Button, Checkbox, Label, Spinner, TextInput } from "flowbite-react";
import { collectRes } from "../db/reservation_extractor";
import { Link } from "react-router-dom";
import { getConfigs, setAutoUpdateAvailability } from "../db/configs";

export type SettingProps = {
  syncing: boolean,
  changeSyncing: any,
  syncingRes: boolean,
  changeResSyncing: any,
  activeMenu: any
}

export const Settings = (props: SettingProps) => {

  const [datePartition, setDatePartition] = useState(formatDatePartition(new Date()))
  const [inventoryConfigs, setInventoryConfigs] = useState<any>()
  const fetchInventoryConfigs = async () => {
    getConfigs("inventory")
      .then((rsp: Response) => {
        if (rsp.ok) {
          return rsp.json()
        }
        return null
      }).then((data: any) => {
        setInventoryConfigs(data)
      }).catch((e: any) => {
        console.error(e)
      })
  }

  useEffect(() => {
    props.activeMenu()
    fetchInventoryConfigs()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeAutoUpdateAvailability = (e: ChangeEvent<HTMLInputElement>) => {
    setAutoUpdateAvailability(e.target.checked)
      .then((rsp: Response) => {
        if (rsp.ok) {
          console.info("Change auto update availability to %s successfully", e.target.checked)
        }
      }
      ).catch((e: any) => {
        console.error(e)
      }
      )
  }

  const syncStatus = () => {
    props.changeSyncing(true)
    console.info("Sync status")
    syncStatusOfMonth(datePartition)
      .then((rsp: Response) => {
        if (rsp.ok) {
          console.info("Sync status of %s successfully", datePartition)
        }
        console.log(rsp)
      }).catch((e: any) => {
        console.error(e)
      }).finally(() => {
        props.changeSyncing(false)
      })
  }

  const syncResStatus = () => {
    props.changeResSyncing(true)
    console.info("Sync reservation...")
    const currentDate = new Date();
    var year = currentDate.getFullYear();
    var month = String(currentDate.getMonth() + 1).padStart(2, '0');
    var day = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    console.info("Current date in ISO format: ", formattedDate);
    let fromDate = formattedDate
    let toDate = formattedDate
    collectRes(fromDate, toDate)
      .then(rsp => {
        if (rsp.ok) {
          console.info("Collect reservations from %s to %s successfully", fromDate, toDate)
        }
        console.log(rsp)
      }).catch(e => {
        console.error(e)
      }).finally(() => {
        props.changeResSyncing(false)
      })
  }

  const changePartition = (e: ChangeEvent<HTMLInputElement>) => {
    let iMsg = e.target.value
    setDatePartition(iMsg)
  }

  return (
    <>
      <div className="bg-slate-50 px-2 pt-6">
        <div className="flex flex-col w-full py-2 px-2">
          <div className="flex flex-row items-center mb-2 border rounded-sm shadow-sm p-2 space-x-2">
            <Label
            >Sync data with partition
            </Label>
            <TextInput
              id="itemMsg"
              placeholder="2024/09 or 2024/09/01"
              required={true}
              value={datePartition}
              onChange={changePartition}
            />
            {
              props.syncing ? <Spinner aria-label="Default status example"
                className="w-14 h-10"
              /> : <Button onClick={() => syncStatus()}>Start</Button>
            }
          </div>
          <div className="flex flex-row items-center mb-2 border rounded-sm shadow-sm p-2">
            <Label
              className="w-32"
            >Sync today reservation</Label>
            {
              props.syncingRes ? <Spinner aria-label="Default status example"
                className="w-14 h-10"
              /> : <Button onClick={() => syncResStatus()}>Start</Button>
            }
          </div>
          <div className="flex flex-row items-center mb-2 border rounded-sm shadow-sm p-2 space-x-2">
            <Checkbox id="updateAvailability"
              checked={inventoryConfigs?.enabled}
              onChange={changeAutoUpdateAvailability}
            />
            <Label>Auto update inventory availability</Label>
          </div>
          <div className="flex flex-row items-center mb-2 border rounded-sm shadow-sm p-2">
            <Link to="../product-group" className="w-32">Product Groups</Link>
          </div>
        </div>
      </div >
    </>
  )
}
