import React, { useEffect } from "react";
import { Chat } from "../App";
import { useNavigate } from "react-router-dom";

type LoginProps = {
  chat: Chat,
  setChat: any,
  users: Chat[] | undefined
}

export const Login = (props: LoginProps) => {
  const navigate = useNavigate()

  useEffect(() => {
    // eslint-disable-next-line
  }, []);

  const changeUser = (chat: Chat) => {
    props.setChat(chat)
    navigate("/")
  }


  return (
    <div className="flex flex-col items-center justify-center h-full pt-3 space-y-3 px-4">
      {
        props.users?.map(user => <div
          key={user.id}
          onClick={() => changeUser(user)}
          className="font font-bold font-sans text-2xl text-center border rounded-sm shadow-md px-4 py-1"
        >{`${user.firstName} ${user.lastName}`}</div>)
      }
    </div >
  );
}
