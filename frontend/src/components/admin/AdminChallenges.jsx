import { useEffect, useState } from 'react';
import {
  apiGetAllChallengesAdmin,
  apiDeleteChallenge
} from '../../services/api';

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const data = await apiGetAllChallengesAdmin();
      setChallenges(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    const ok = window.confirm(
      `Delete "${title}" ?`
    );

    if (!ok) return;

    try {
      await apiDeleteChallenge(id);

      setChallenges(prev =>
        prev.filter(c => c.id !== id)
      );
    } catch (err) {
      alert(err.message);
    }
  };

const handleEdit = (challenge) => {
  window.location.href =
    `/admin/challenges/edit/${challenge.id}`;
};

  if (loading) {
    return <div style={{ paddingTop: 120 }}>Loading...</div>;
  }

  return (
    <div
      className="container"
      style={{
        paddingTop: '120px',
        paddingBottom: '60px'
      }}
    >
      <h1>Challenge Manager</h1>

      <div
        style={{
          display: 'grid',
          gap: '20px',
          marginTop: '30px'
        }}
      >
        {challenges.map(challenge => (
          <div
            key={challenge.id}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '20px'
            }}
          >
            <h3>{challenge.title}</h3>

            <p>
              Entries: {challenge.submission_count}
            </p>

            <p>
              Status:{' '}
              {challenge.is_active
                ? '🟢 Active'
                : '🔴 Ended'}
            </p>

            <button
  onClick={() => handleEdit(challenge)}
  style={{
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '10px',
    cursor: 'pointer',
    marginRight: '10px'
  }}
>
  Edit Challenge
</button>

            <button
              onClick={() =>
                handleDelete(
                  challenge.id,
                  challenge.title
                )
              }
              style={{
                background: '#dc2626',
                color: 'white',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                cursor: 'pointer'
              }}
            >
              Delete Challenge
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}