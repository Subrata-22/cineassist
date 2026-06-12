import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  apiGetNotifications,
  apiMarkNotificationsRead
} from '../../services/api';
import './Notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  Promise.all([
    apiGetNotifications(),
    apiMarkNotificationsRead()
  ])
    .then(([data]) => {
      setNotifications(data);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);

  if (loading) {
    return (
      <div className="notifications-page">
        <h1>Notifications</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <h1 className="notifications-title">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="notifications-empty">
          No notifications yet.
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((n) => (
            <div key={n.id} className="notification-card">
              <div className="notification-avatar">
                {n.username?.charAt(0).toUpperCase() || '?'}
              </div>

              <div className="notification-content">
                <div>
  <Link
    to={`/user/${n.username}`}
    className="notification-user"
  >
    {n.username}
  </Link>

  <span>
    {' '}
    {n.message.replace(`${n.username} `, '')}
  </span>
</div>

{n.analysis_id && (
  <Link
    to={`/analysis/${n.analysis_id}`}
    className="notification-shot-link"
  >
    View Shot →
  </Link>
)}

                <span className="notification-time">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}