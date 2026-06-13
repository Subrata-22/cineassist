import { useEffect, useState } from 'react';
import { apiGetAnalytics } from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiGetAnalytics().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div
        style={{
          paddingTop: 120
        }}
      >
        Loading...
      </div>
    );
  }

const chartData = [
  {
    name: 'Users',
    value: stats.users
  },
  {
    name: 'Analyses',
    value: stats.analyses
  },
  {
    name: 'Challenges',
    value: stats.challenges
  },
  {
    name: 'Submissions',
    value: stats.submissions
  },
  {
    name: 'Votes',
    value: stats.votes
  }
];

  return (
    <div
      className="container"
      style={{
        paddingTop: '120px'
      }}
    >
      <h1>
        Admin Analytics
      </h1>

      <div
  style={{
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    marginBottom: '30px'
  }}
>
  <a
    href="/admin/challenges"
    className="btn"
  >
    Manage Challenges
  </a>

  <a
    href="/admin/challenges/create"
    className="btn btn-primary"
  >
    Create Challenge
  </a>
</div>

<div
  style={{
    marginTop: '50px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '30px'
  }}
>
  <h2 style={{ marginBottom: '20px' }}>
    Platform Overview
  </h2>

  <ResponsiveContainer
    width="100%"
    height={350}
  >
    <BarChart data={chartData}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar
        dataKey="value"
        fill="#f5b942"
      />
    </BarChart>
  </ResponsiveContainer>
</div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(5,1fr)',
          gap: '20px',
          marginTop: '30px'
        }}
      >
        <div className="card">
          Users
          <h2>{stats.users}</h2>
        </div>

        <div className="card">
          Analyses
          <h2>{stats.analyses}</h2>
        </div>

        <div className="card">
          Challenges
          <h2>{stats.challenges}</h2>
        </div>

        <div className="card">
          Submissions
          <h2>{stats.submissions}</h2>
        </div>

        <div className="card">
          Votes
          <h2>{stats.votes}</h2>
        </div>
      </div>
    </div>
  );
}