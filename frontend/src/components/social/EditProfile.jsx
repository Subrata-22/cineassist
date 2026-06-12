import { useState } from 'react';
import {
  apiUploadAvatar,
  apiUpdateProfile
} from '../../services/api.js';
import { useAuth } from '../../store/AuthContext.jsx';

export default function EditProfile() {
  const { user } = useAuth();

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || '');

  const handleSave = async () => {
  try {
    await apiUpdateProfile({
      username,
      bio
    });

    if (avatarFile) {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const result = await apiUploadAvatar(formData);

      setAvatarPreview(result.avatar_url);
    }

    alert('Profile updated successfully');
  } catch (err) {
    alert(err.message);
  }
};

  return (
    <div className="container" style={{ paddingTop: '120px', maxWidth: '700px' }}>
      <h1>Edit Profile</h1>

      <div style={{ marginTop: '30px' }}>
        <div style={{ marginBottom: '30px' }}>
  <label>Profile Avatar</label>

  <div
  style={{
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: '#222',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    marginTop: '10px',
    marginBottom: '15px'
  }}
>
  {avatarPreview ? (
    <img
      src={avatarPreview}
      alt="avatar"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }}
    />
  ) : (
    username[0]?.toUpperCase()
  )}
</div>

  <input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files[0];

    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }}
/>
</div>
        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '8px',
            marginBottom: '20px'
          }}
        />

        <label>Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '8px',
            marginBottom: '20px'
          }}
        />

        <button
          className="btn btn-primary"
          onClick={handleSave}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}