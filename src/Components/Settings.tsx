import { formatDatePartition } from "../Service/Utils";
import { syncStatusOfMonth } from "../db/status";
import React, { ChangeEvent, useEffect, useState, FormEvent } from "react";
import { Button, Checkbox, Label, Spinner, TextInput, Modal } from "flowbite-react";
import { Link } from "react-router-dom";
import { getConfigs, setAutoUpdateAvailability } from "../db/configs";
import { syncReservationFromMailbox } from "../db/reservation";
import { Chat } from "../App";
import { registerBot } from '../db/bot'; // Import registerBot

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

  // Bot Registration State
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [botId, setBotId] = useState('');
  const [botToken, setBotToken] = useState('');
  const [isRegisteringBot, setIsRegisteringBot] = useState(false);

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

  // Bot Registration Handlers
  const handleBotIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBotId(e.target.value);
  };

  const handleBotTokenChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBotToken(e.target.value);
  };

  const handleRegisterBot = async (e: FormEvent) => {
    e.preventDefault();
    if (!botId || !botToken) {
      alert('Bot ID and Bot Token are required.'); // Simple alert for now
      return;
    }

    setIsRegisteringBot(true);
    try {
      await registerBot(botId, botToken);
      alert('Bot registered successfully!'); // Success feedback
      setBotId('');
      setBotToken('');
      setIsBotModalOpen(false);
    } catch (error) {
      console.error('Bot registration failed:', error);
      // Assuming error object has a message property
      alert(`Bot registration failed: ${error.message || 'An unknown error occurred'}`); // Error feedback
    } finally {
      setIsRegisteringBot(false);
    }
  };


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

          {/* New Button for Bot Registration */}
          <div className="flex flex-row items-center mb-2 border rounded-sm shadow-sm p-2 space-x-2">
            <Label className="w-32">Bot Registration</Label>
            <Button onClick={() => setIsBotModalOpen(true)}>Register Bot</Button>
          </div>
        </div>
      </div >

      {/* Bot Registration Modal */}
      <Modal show={isBotModalOpen} onClose={() => setIsBotModalOpen(false)} size="md" popup>
        <Modal.Header />
        <Modal.Body>
          <form onSubmit={handleRegisterBot} className="space-y-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">Register Your Bot</h3>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="botId" value="Bot ID" />
              </div>
              <TextInput
                id="botId"
                placeholder="Enter Bot ID"
                value={botId}
                onChange={handleBotIdChange}
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="botToken" value="Bot Token" />
              </div>
              <TextInput
                id="botToken"
                type="password" // Masked input
                placeholder="Enter Bot Token"
                value={botToken}
                onChange={handleBotTokenChange}
                required
              />
            </div>
            <div className="w-full">
              {isRegisteringBot ? (
                <Button color="gray" className="w-full" disabled>
                  <Spinner size="sm" />
                  <span className="pl-3">Registering...</span>
                </Button>
              ) : (
                <Button type="submit" className="w-full">Register Bot</Button>
              )}
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  )
}
