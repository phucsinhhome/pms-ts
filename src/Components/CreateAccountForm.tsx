import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const CreateAccountForm: React.FC<{ onAccountCreated?: () => void }> = ({ onAccountCreated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const auth = getAuth();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: `${firstName} ${lastName}`.trim()
        });
      }
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
            First Name:
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              autoFocus
            />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <label>
            Last Name:
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
            />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
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