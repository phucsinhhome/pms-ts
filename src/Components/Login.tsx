import React, { useEffect, useState } from "react";
import { Chat } from "../App";
import { useNavigate } from "react-router-dom";

type LoginProps = {
  chat: Chat,
  setChat: any,
  users: Chat[] | undefined
}

export const Login = (props: LoginProps) => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // eslint-disable-next-line
  }, []);

  const changeUser = (chat: Chat) => {
    props.setChat(chat)
    navigate("/")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add authentication logic here
    alert(`Logging in as ${username}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full pt-3 space-y-3 px-4">
      <form onSubmit={handleSubmit} style={{ maxWidth: 300, margin: '0 auto' }}>
        <h2>Login</h2>
        <div>
          <label>
            Username:
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <label>
            Password:
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit" style={{ marginTop: 16 }}>Login</button>
      </form>
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
