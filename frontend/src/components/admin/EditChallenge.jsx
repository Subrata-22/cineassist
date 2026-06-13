import { useState, useEffect } from 'react';
import {
  apiGetChallenge,
  apiUpdateChallenge,
  apiUploadChallengeBanner
} from '../../services/api';
import {
  useParams,
  useNavigate
} from 'react-router-dom';

export default function EditChallenge() {
    console.log('EDIT COMPONENT LOADED');
    const { id } = useParams();
const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    theme: '',
    focus_module: '',
    start_date: '',
    end_date: '',
  });

  const [bannerFile, setBannerFile] = useState(null);
const [bannerPreview, setBannerPreview] = useState('');
useEffect(() => {
  loadChallenge();
}, [id]);

const loadChallenge = async () => {
  try {
    const data = await apiGetChallenge(id);

    setForm({
      title: data.challenge.title || '',
      description: data.challenge.description || '',
      theme: data.challenge.theme || '',
      focus_module:
        data.challenge.focus_module || '',
      start_date:
        data.challenge.start_date
          ?.slice(0, 16) || '',
      end_date:
        data.challenge.end_date
          ?.slice(0, 16) || '',
    });

    setBannerPreview(
      data.challenge.banner_url || ''
    );
  } catch (err) {
    alert(err.message);
  }
};

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        let banner_url = '';

if (bannerFile) {
  const formData = new FormData();

  formData.append('banner', bannerFile);

  const uploadResult =
    await apiUploadChallengeBanner(formData);

  banner_url = uploadResult.banner_url;
}
      await apiUpdateChallenge(id, {
  ...form,
  banner_url: banner_url || bannerPreview,
});

      alert('Challenge updated successfully!');
      navigate('/admin/challenges');

    } catch (err) {
      alert(err.message);
    }
  };

 return (
  <div
    className="container"
    style={{
      paddingTop: '120px',
      paddingBottom: '60px',
    }}
  >
    <div
      style={{
        maxWidth: '850px',
        margin: '0 auto',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '40px',
        backdropFilter: 'blur(20px)',
      }}
    >
      <h1
        style={{
          fontSize: '2rem',
          marginBottom: '10px',
        }}
      >
        Edit Challenge
      </h1>

      <p
        style={{
          opacity: 0.7,
          marginBottom: '30px',
        }}
      >
        Update an existing challenge.
      </p>

      <a
  href="/admin/challenges"
  className="btn"
  style={{
    marginBottom: '20px',
    display: 'inline-block'
  }}
>
  Manage Challenges
</a>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '18px' }}>
          <label>Challenge Title</label>

          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Golden Hour Challenge"
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '8px',
              borderRadius: '12px',
            }}
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label>Description</label>

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            placeholder="Describe the challenge..."
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '8px',
              borderRadius: '12px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
  <label>Challenge Banner</label>

  {bannerPreview && (
    <img
      src={bannerPreview}
      alt="banner"
      style={{
        width: '100%',
        height: '220px',
        objectFit: 'cover',
        borderRadius: '16px',
        marginTop: '10px',
        marginBottom: '12px'
      }}
    />
  )}

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files[0];

      if (!file) return;

      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }}
  />
</div>

        <div style={{ marginBottom: '18px' }}>
          <label>Theme</label>

          <input
            name="theme"
            value={form.theme}
            onChange={handleChange}
            placeholder="Golden Hour"
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '8px',
              borderRadius: '12px',
            }}
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label>Focus Module</label>

          <input
            name="focus_module"
            value={form.focus_module}
            onChange={handleChange}
            placeholder="Lighting"
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '8px',
              borderRadius: '12px',
            }}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '25px',
          }}
        >
          <div>
            <label>Start Date</label>

            <input
              type="datetime-local"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '8px',
                borderRadius: '12px',
              }}
            />
          </div>

          <div>
            <label>End Date</label>

            <input
              type="datetime-local"
              name="end_date"
              value={form.end_date}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '8px',
                borderRadius: '12px',
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1rem',
          }}
        >
          Update Challenge
        </button>
      </form>
    </div>
  </div>
);
}