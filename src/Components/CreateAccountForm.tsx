import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const CreateAccountForm: React.FC<{ onAccountCreated?: () => void }> = ({ onAccountCreated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const auth = getAuth();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      if (onAccountCreated) onAccountCreated();
      // Optionally redirect or show a success message here
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>
        <h2>Create Account</h2>
        <div>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
        <button type="submit" style={{ marginTop: 16 }}>Create Account</button>
      </form>
    </div>
  );
};

export default CreateAccountForm;