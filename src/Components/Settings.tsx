import { formatDatePartition } from "../Service/Utils";
import { syncStatusOfMonth } from "../db/status";
import React, { ChangeEvent, useEffect, useState } from "react";
import { Button, Checkbox, Label, Spinner, TextInput } from "flowbite-react";
import { Link } from "react-router-dom";
import { getConfigs, setAutoUpdateAvailability } from "../db/configs";
import { syncReservationFromMailbox } from "../db/reservation";
import { Chat } from "../App";

export type SettingProps = {
  syncing: boolean,
  changeSyncing: any,
  syncingRes: boolean,
  changeResSyncing: any,
  activeMenu: any,
  chat: Chat
}

export const Settings = (props: SettingProps) => {

  const [datePartition, setDatePartition] = useState(formatDatePartition(new Date()))
  const [inventoryConfigs, setInventoryConfigs] = useState<any>()

  const fetchInventoryConfigs = async () => {
    getConfigs("inventory")
      .then((rsp) => {
        if (rsp.status === 200) {
          return rsp.data;
        }
        return null;
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

  const changeAutoUpdateAvailability = () => {
    let enabled = !inventoryConfigs?.enabled
    setAutoUpdateAvailability(enabled)
      .then((rsp) => {
        if (rsp.status === 200) {
          console.info("Change auto update availability to %s successfully", enabled)
          setInventoryConfigs(rsp.data)
        }
      })
      .catch((e: any) => {
        console.error(e)
      }
      )
  }

  const syncStatus = () => {
    props.changeSyncing(true)
    console.info("Sync status")
    syncStatusOfMonth(datePartition)
      .then((rsp) => {
        if (rsp.status === 200) {
          console.info("Sync status of %s successfully", datePartition)
        }
        console.log(rsp)
      }).catch((e: any) => {
        console.error(e)
      }).finally(() => {
        props.changeSyncing(false)
      })
  }

  const handleGoogleLogin = () => {
    console.info("Redirecting to Google OAuth2 login...")
    const authUrl = `${process.env.REACT_APP_PS_BASE_URL}/oauth2/authorization/google`;
    window.location.href = authUrl;
  };


  const syncReservation = async (code: string) => {
    try {
      props.changeResSyncing(true)
      console.info("Sync reservation...")
      const res = await syncReservationFromMailbox(code)
      if (res.status === 200) {
        console.info("Sync reservation successfully")
      }
    } catch (e) {
      console.error(e)
    } finally {
      props.changeResSyncing(false)
    }
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
              props.chat?.iss !== 'https://accounts.google.com' ? (
                props.syncing ? <Spinner aria-label="Default status example"
                  className="w-14 h-10"
                /> : <Button onClick={() => syncStatus()}>Start</Button>) : <></>
            }
          </div>
          <div className="flex flex-row items-center mb-2 border rounded-sm shadow-sm p-2 space-x-2">
            <Label
              className="w-32"
            >Sync today reservation</Label>
            {
              props.chat?.iss === 'https://accounts.google.com' ? (props.syncingRes ? <Spinner aria-label="Default status example"
                className="w-14 h-10"
              /> : <Button onClick={() => syncReservation('435345')}>Start</Button>)
                : <Button onClick={handleGoogleLogin}>Login with Google</Button>
            }

          </div>

          <div className="flex flex-row items-center mb-2 border rounded-sm shadow-sm p-2 space-x-2">
            <Checkbox id="updateAvailability"
              checked={inventoryConfigs?.enabled}
              onChange={changeAutoUpdateAvailability}
              disabled={props.chat?.iss === 'https://accounts.google.com'}
            />
            <Label>Auto update inventory availability</Label>
          </div>
          <div className="flex flex-row items-center mb-2 border rounded-sm shadow-sm p-2">
            {
              props.chat?.iss === 'https://accounts.google.com' ? <></> :
                <Link to="../product-group" className="w-32">Product Groups</Link>
            }
          </div>
        </div>
      </div >
    </>
  )
}
