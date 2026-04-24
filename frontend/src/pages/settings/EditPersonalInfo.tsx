import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { updateAccountDetails, updateUserAvatar, updateUserCoverImage } from '../../context/api.service';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const EditPersonalInfo: React.FC = () => {
  const { user, setUser } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setFormData({
      fullName: user?.name || '',
      email: user?.email || '',
    });
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }

      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [avatarPreviewUrl, coverPreviewUrl]);

  const displayAvatar = avatarPreviewUrl || user?.avatar || '';
  const displayCoverImage = coverPreviewUrl || user?.coverImage || '';

  const coverStyle = useMemo(
    () => (displayCoverImage ? { backgroundImage: `url(${displayCoverImage})` } : undefined),
    [displayCoverImage]
  );

  const clearPreview = (previewUrl: string, setter: (value: string) => void) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setter('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();

    if (!fullName || !email) {
      setError('Full name and email are required.');
      return;
    }

    try {
      setIsSaving(true);

      const accountResponse = await updateAccountDetails({ fullName, email });
      const nextName = accountResponse.fullName || fullName;
      const nextEmail = accountResponse.email || email;
      let nextAvatar = user?.avatar || '';
      let nextCoverImage = user?.coverImage || '';

      if (avatarFile) {
        const avatarResponse = await updateUserAvatar(avatarFile);
        nextAvatar = avatarResponse.avatar || nextAvatar;
      }

      if (coverFile) {
        const coverResponse = await updateUserCoverImage(coverFile);
        nextCoverImage = coverResponse.coverImage || nextCoverImage;
      }

      setUser((currentUser) =>
        currentUser
          ? {
              ...currentUser,
              name: nextName,
              email: nextEmail,
              avatar: nextAvatar,
              coverImage: nextCoverImage,
            }
          : currentUser
      );

      setFormData({
        fullName: nextName,
        email: nextEmail,
      });
      setAvatarFile(null);
      setCoverFile(null);
      clearPreview(avatarPreviewUrl, setAvatarPreviewUrl);
      clearPreview(coverPreviewUrl, setCoverPreviewUrl);
      setSuccessMessage('Profile updated successfully.');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearPreview(avatarPreviewUrl, setAvatarPreviewUrl);
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearPreview(coverPreviewUrl, setCoverPreviewUrl);
    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setFormData({
      fullName: user?.name || '',
      email: user?.email || '',
    });
    setAvatarFile(null);
    setCoverFile(null);
    clearPreview(avatarPreviewUrl, setAvatarPreviewUrl);
    clearPreview(coverPreviewUrl, setCoverPreviewUrl);
    setError('');
    setSuccessMessage('');
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
              <Link to="/settings/personal" className="block px-4 py-2 rounded-lg bg-purple-500 text-white">
                Personal Info
              </Link>
              <Link to="/settings/channel" className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-slate-700">
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
                  {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
                  {successMessage && (
                    <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      {successMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Cover Image</label>
                    <div className="relative">
                      <div
                        className={`w-full h-32 rounded-lg border-2 border-dashed border-gray-600 transition-colors hover:border-purple-500 ${
                          displayCoverImage ? 'bg-cover bg-center bg-no-repeat' : 'bg-slate-900/70'
                        }`}
                        style={coverStyle}
                      >
                        {!displayCoverImage && (
                          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                            No cover image uploaded yet.
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <label className="cursor-pointer flex flex-col items-center text-white">
                            <Camera size={24} className="mb-2" />
                            <span className="text-sm">Change Cover</span>
                            <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar src={displayAvatar} alt={user?.name || 'User avatar'} className="w-20 h-20 border-4 border-slate-600" />
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <label className="cursor-pointer text-white">
                            <Upload size={20} />
                            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                          </label>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-300">Upload a new profile picture</p>
                        <p className="text-xs text-gray-400">JPG, PNG or GIF.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Full name</label>
                    <Input type="text" value={formData.fullName} onChange={(e) => setFormData((current) => ({ ...current, fullName: e.target.value }))} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email address</label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData((current) => ({ ...current, email: e.target.value }))} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Appearance</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setThemeMode('light')}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          themeMode === 'light'
                            ? 'border-purple-500 bg-purple-500/20 text-white'
                            : 'border-slate-600 bg-slate-700/40 text-gray-300 hover:bg-slate-700'
                        }`}
                      >
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeMode('dark')}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          themeMode === 'dark'
                            ? 'border-purple-500 bg-purple-500/20 text-white'
                            : 'border-slate-600 bg-slate-700/40 text-gray-300 hover:bg-slate-700'
                        }`}
                      >
                        Dark
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeMode('system')}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          themeMode === 'system'
                            ? 'border-purple-500 bg-purple-500/20 text-white'
                            : 'border-slate-600 bg-slate-700/40 text-gray-300 hover:bg-slate-700'
                        }`}
                      >
                        System
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <Button type="button" variant="secondary" onClick={resetForm} disabled={isSaving}>
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

export default EditPersonalInfo;
