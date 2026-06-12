import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  apiGetUserProfile,
  apiGetFollowers,
  apiGetFollowing
} from '../../services/api.js';

export default function FollowList() {
  const { username, type } = useParams();

  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const user = await apiGetUserProfile(username);
      setProfile(user);

      if (type === 'followers') {
        const data = await apiGetFollowers(user.id);
        setUsers(data);
      } else {
        const data = await apiGetFollowing(user.id);
        setUsers(data);
      }
    };

    loadData();
  }, [username, type]);

  return (
    <div className="container" style={{ paddingTop: '120px' }}>
      <h1>
        @{profile?.username} {type}
      </h1>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        users.map((u) => (
          <Link
            key={u.id}
            to={`/user/${u.username}`}
            className="profile-user-row"
          >
            <div className="profile-user-avatar">
              {u.username[0].toUpperCase()}
            </div>

            <span>@{u.username}</span>
          </Link>
        ))
      )}
    </div>
  );
}