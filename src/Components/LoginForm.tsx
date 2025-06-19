import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

interface LoginFormProps {
  onCreateAccountClick?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onCreateAccountClick }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, username, password);
      // Handle successful login (e.g., redirect or show success message)
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        <div>
          <label>
            Email:
            <input
              type="email"
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
        {error && (
          <div style={{ color: 'red', marginTop: 8 }}>{error}</div>
        )}
        <button type="submit" style={{ marginTop: 16 }}>Login</button>
      </form>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          type="button"
          style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          onClick={onCreateAccountClick}
        >
          Create an account
        </button>
      </div>
    </div>
  );
};

export default LoginForm;