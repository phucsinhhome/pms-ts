import React, { useState } from 'react';
import { getAuth, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const UserProfile: React.FC = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(() => user?.displayName?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(() => user?.displayName?.split(' ').slice(1).join(' ') || '');
  const [status, setStatus] = useState<string | null>(null);

  if (!user) {
    return <div className="p-4">No user profile found.</div>;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`.trim()
      });
      setStatus('Profile updated successfully.');
      setEditing(false);
    } catch (err: any) {
      setStatus('Failed to update profile.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded shadow p-6">
      <button
        className="mb-4 bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400"
        onClick={() => navigate(-1)}
        type="button"
      >
        &larr; Back
      </button>
      <h2 className="text-xl font-bold mb-4">My Profile</h2>
      <div className="mb-4">
        <label className="block text-gray-700">Email:</label>
        <div className="text-gray-900">{user.email}</div>
      </div>
      <form onSubmit={handleSave}>
        <div className="mb-4">
          <label className="block text-gray-700">First Name:</label>
          {editing ? (
            <input
              className="border rounded px-2 py-1 w-full"
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
              autoFocus
            />
          ) : (
            <div className="text-gray-900">{firstName}</div>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Last Name:</label>
          {editing ? (
            <input
              className="border rounded px-2 py-1 w-full"
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
            />
          ) : (
            <div className="text-gray-900">{lastName}</div>
          )}
        </div>
        {status && <div className="mb-2 text-green-600">{status}</div>}
        {editing ? (
          <div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-1 rounded mr-2"
            >
              Save
            </button>
            <button
              type="button"
              className="bg-gray-400 text-white px-4 py-1 rounded"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-1 rounded"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        )}
      </form>
    </div>
  );
};

export default UserProfile;