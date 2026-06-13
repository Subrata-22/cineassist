const BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('ca_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

// ── Auth ──────────────────────────────────────────────
export const apiRegister = (body) =>
  fetch(`${BASE}/auth/register`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);

export const apiLogin = (body) =>
  fetch(`${BASE}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);

export const apiGetMe = () =>
  fetch(`${BASE}/auth/me`, { headers: getHeaders() }).then(handle);

export const apiUpdateProfile = (body) =>
  fetch(`${BASE}/auth/profile`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(body),
  }).then(handle);

  export const apiUploadAvatar = (formData) => {
  const token = localStorage.getItem('ca_token');

  return fetch(`${BASE}/auth/avatar`, {
    method: 'POST',
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
    body: formData,
  }).then(handle);
};

export const apiUploadChallengeBanner = (formData) => {
  const token = localStorage.getItem('ca_token');

  return fetch(`${BASE}/challenges/banner`, {
    method: 'POST',
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
    body: formData,
  }).then(handle);
};

export const apiDeleteAccount = () =>
  fetch(`${BASE}/auth/account`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(handle);

// ── Analyses ──────────────────────────────────────────
export const apiSaveAnalysis = (formData) => {
  const token = localStorage.getItem('ca_token');
  return fetch(`${BASE}/analyses`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  }).then(handle);
};

export const apiGetMyAnalyses = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${BASE}/analyses/me?${q}`, { headers: getHeaders() }).then(handle);
};

export const apiGetAnalysis = (id) =>
  fetch(`${BASE}/analyses/${id}`, { headers: getHeaders() }).then(handle);

export const apiDeleteAnalysis = (id) =>
  fetch(`${BASE}/analyses/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handle);

export const apiRenameAnalysis = (id, title) =>
  fetch(`${BASE}/analyses/${id}/rename`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ title }),
  }).then(handle);

export const apiToggleVisibility = (id, is_public) =>
  fetch(`${BASE}/analyses/${id}/visibility`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ is_public }),
  }).then(handle);

export const apiToggleLike = (id) =>
  fetch(`${BASE}/analyses/${id}/like`, { method: 'POST', headers: getHeaders() }).then(handle);

export const apiGetPublicFeed = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${BASE}/analyses/feed?${q}`, { headers: getHeaders() }).then(handle);
};

export const apiGetScoreHistory = (days = 30) =>
  fetch(`${BASE}/analyses/history?days=${days}`, { headers: getHeaders() }).then(handle);

export const apiCompareShots = (idA, idB) =>
  fetch(`${BASE}/analyses/compare`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ idA, idB }),
  }).then(handle);

  export const apiGenerateAIReview = (id) =>
  fetch(`${BASE}/analyses/${id}/ai-review`, {
    method: 'POST',
    headers: getHeaders(),
  }).then(handle);

// ── Comments ──────────────────────────────────────────
export const apiGetComments = (analysisId) =>
  fetch(`${BASE}/analyses/${analysisId}/comments`, { headers: getHeaders() }).then(handle);

export const apiAddComment = (analysisId, body) =>
  fetch(`${BASE}/analyses/${analysisId}/comments`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(body),
  }).then(handle);

export const apiDeleteComment = (commentId) =>
  fetch(`${BASE}/comments/${commentId}`, { method: 'DELETE', headers: getHeaders() }).then(handle);

// ── Social ────────────────────────────────────────────
export const apiFollowUser = (userId) =>
  fetch(`${BASE}/users/${userId}/follow`, { method: 'POST', headers: getHeaders() }).then(handle);

export const apiGetFollowers = (userId) =>
  fetch(`${BASE}/users/${userId}/followers`, {
    headers: getHeaders(),
  }).then(handle);

export const apiGetFollowing = (userId) =>
  fetch(`${BASE}/users/${userId}/following`, {
    headers: getHeaders(),
  }).then(handle);

export const apiGetUserProfile = (username) =>
  fetch(`${BASE}/users/${username}/profile`, { headers: getHeaders() }).then(handle);

export const apiGetUserAnalyses = (username, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${BASE}/users/${username}/analyses?${q}`, { headers: getHeaders() }).then(handle);
};

export const apiGetLeaderboard = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${BASE}/social/leaderboard?${q}`, { headers: getHeaders() }).then(handle);
};

export const apiGetFollowingFeed = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${BASE}/social/feed?${q}`, { headers: getHeaders() }).then(handle);
};

export const apiGetAllChallengesAdmin = () =>
  fetch(`${BASE}/admin/challenges`, {
    headers: getHeaders(),
  }).then(handle);

  export const apiGetAnalytics = () =>
  fetch(
    `${BASE}/admin/analytics`,
    {
      headers: getHeaders()
    }
  ).then(handle);

 export const apiGetNotifications = () =>
  fetch(`${BASE}/notifications`, {
    headers: getHeaders(),
  }).then(handle);

export const apiMarkNotificationsRead = () =>
  fetch(`${BASE}/notifications/read`, {
    method: 'POST',
    headers: getHeaders(),
  }).then(handle);

// ── Challenges ────────────────────────────────────────
export const apiGetChallenges = () =>
  fetch(`${BASE}/challenges`, { headers: getHeaders() }).then(handle);

export const apiDeleteChallenge = (id) =>
  fetch(`${BASE}/challenges/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(handle);

  export const apiUpdateChallenge = (id, body) =>
  fetch(`${BASE}/challenges/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  }).then(handle);

export const apiGetChallenge = (id, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return fetch(`${BASE}/challenges/${id}?${q}`, { headers: getHeaders() }).then(handle);
};

export const apiGetChallengeResults = (id) =>
  fetch(
    `${BASE}/challenges/${id}/results`,
    { headers: getHeaders() }
  ).then(handle);

export const apiCreateChallenge = (body) =>
  fetch(`${BASE}/challenges`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  }).then(handle);

export const apiSubmitChallenge = (challengeId, body) =>
  fetch(`${BASE}/challenges/${challengeId}/submit`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify(body),
  }).then(handle);

export const apiVoteSubmission = (submissionId) =>
  fetch(`${BASE}/challenge-submissions/${submissionId}/vote`, {
    method: 'POST', headers: getHeaders(),
  }).then(handle);

  export const apiDeleteSubmission = (
  submissionId
) =>
  fetch(
    `${BASE}/challenge-submissions/${submissionId}`,
    {
      method: 'DELETE',
      headers: getHeaders()
    }
  ).then(handle);

// ── Sequences ─────────────────────────────────────────
export const apiCreateSequence = (body) =>
  fetch(`${BASE}/sequences`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);

export const apiGetMySequences = () =>
  fetch(`${BASE}/sequences/me`, { headers: getHeaders() }).then(handle);

export const apiGetSequence = (id) =>
  fetch(`${BASE}/sequences/${id}`, { headers: getHeaders() }).then(handle);

export const apiUpdateSequence = (id, body) =>
  fetch(`${BASE}/sequences/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(body) }).then(handle);

export const apiDeleteSequence = (id) =>
  fetch(`${BASE}/sequences/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handle);
