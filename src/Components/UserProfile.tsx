import React, { useState } from "react";

type UserProfileProps = {
  userProfile: any;
  onSignOut: () => void;
};

const UserProfile: React.FC<UserProfileProps> = ({ userProfile, onSignOut }) => {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(userProfile?.given_name || "");
  const [lastName, setLastName] = useState(userProfile?.family_name || "");
  const [displayName, setDisplayName] = useState(userProfile?.name || "");
  const [status, setStatus] = useState<string | null>(null);

  if (!userProfile) return <div className="p-4">No user profile found.</div>;

  // Placeholder for update logic: In most OIDC/Keycloak setups, profile updates are done via Keycloak UI or API.
  // Here, we just simulate a successful update.
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, call your backend or Keycloak REST API to update profile.
    setStatus("Profile updated (simulation).");
    setEditing(false);
  };

  return (
    <div className="w-[90vw] max-w-2xl mx-auto mt-10 bg-white rounded shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <button
          className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400"
          onClick={() => window.history.back()}
          type="button"
        >
          &larr; Back
        </button>
        <button
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          onClick={onSignOut}
          type="button"
        >
          Sign Out
        </button>
      </div>
      <h2 className="text-xl font-bold mb-4">My Profile</h2>
      <form onSubmit={handleSave}>
        <div className="mb-4">
          <label className="block text-gray-700">Username:</label>
          <div className="text-gray-900">{userProfile.preferred_username || userProfile.email}</div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Email:</label>
          <div className="text-gray-900">{userProfile.email}</div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Display Name:</label>
          {editing ? (
            <input
              className="border rounded px-2 py-1 w-full"
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
            />
          ) : (
            <div className="text-gray-900">{displayName}</div>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">First Name:</label>
          {editing ? (
            <input
              className="border rounded px-2 py-1 w-full"
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
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