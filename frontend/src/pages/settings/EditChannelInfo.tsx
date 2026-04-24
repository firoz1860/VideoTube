import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { updateAccountDetails } from '../../context/api.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const EditChannelInfo: React.FC = () => {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!username.trim()) {
      setError('Username is required.');
      return;
    }

    try {
      setIsSaving(true);
      const response = await updateAccountDetails({
        fullName: user?.name,
        email: user?.email,
        username: username.trim(),
      });

      const nextUsername = response.username || response.data?.username || username.trim();
      setUser((currentUser) => (currentUser ? { ...currentUser, username: nextUsername } : currentUser));
      setUsername(nextUsername);
      setSuccessMessage('Channel settings updated successfully.');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to update channel settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Settings</h1>
            <p className="text-gray-400">Manage your account settings and preferences.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <nav className="space-y-1">
              <Link to="/settings/personal" className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-slate-700">
                Personal Info
              </Link>
              <Link to="/settings/channel" className="block px-4 py-2 rounded-lg bg-purple-500 text-white">
                Channel Info
              </Link>
              <Link to="/settings/password" className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-slate-700">
                Password
              </Link>
            </nav>
          </div>

          <div className="md:col-span-3">
            <div className="bg-slate-800 rounded-lg p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {error && (
                    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      {successMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">vidplay.com/</span>
                      <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <Button type="button" variant="secondary" onClick={() => setUsername(user?.username || '')} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditChannelInfo;
