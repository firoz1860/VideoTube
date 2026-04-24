import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { changeCurrentPassword } from '../../context/api.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const ChangePassword: React.FC = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetForm = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      setIsSaving(true);
      await changeCurrentPassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      setSuccessMessage('Password updated successfully.');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update password.');
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
              <Link
                to="/settings/personal"
                className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-slate-700"
              >
                Personal Info
              </Link>
              <Link
                to="/settings/channel"
                className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-slate-700"
              >
                Channel Info
              </Link>
              <Link
                to="/settings/password"
                className="block px-4 py-2 rounded-lg bg-purple-500 text-white"
              >
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
                    <label className="block text-sm font-medium mb-1">Current password</label>
                    <Input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData((current) => ({ ...current, currentPassword: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">New password</label>
                    <Input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData((current) => ({ ...current, newPassword: e.target.value }))}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Your new password must be at least 8 characters long.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Confirm password</label>
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData((current) => ({ ...current, confirmPassword: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <Button type="button" variant="secondary" onClick={resetForm} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Updating...' : 'Update Password'}
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

export default ChangePassword;
