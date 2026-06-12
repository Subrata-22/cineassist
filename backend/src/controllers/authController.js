import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { uploadImage } from '../config/cloudinary.js';

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
  return res.status(400).json({
    error: 'Please enter a valid email address'
  });
}
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/^[a-zA-Z0-9_]{3,40}$/.test(username)) {
      return res.status(400).json({ error: 'Username must be 3–40 characters: letters, numbers, underscores' });
    }

   const emailExists = await query(
  'SELECT id FROM users WHERE email = $1',
  [email.toLowerCase()]
);

if (emailExists.rows.length > 0) {
  return res.status(409).json({
    error: 'Email already registered'
  });
}

const usernameExists = await query(
  'SELECT id FROM users WHERE username = $1',
  [username.toLowerCase()]
);

if (usernameExists.rows.length > 0) {
  return res.status(409).json({
    error: 'Username already taken'
  });
}

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, avatar_url, bio, role, created_at`,
      [username.toLowerCase(), email.toLowerCase(), passwordHash]
    );
    const user = result.rows[0];
    const token = signToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query(
      'SELECT id, username, email, password_hash, avatar_url, bio, role, is_active FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = result.rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.password_hash) {
      return res.status(401).json({ error: 'This account uses OAuth. Please sign in with Google.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { password_hash, ...userOut } = user;
    const token = signToken(user.id);
    res.json({ token, user: userOut });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res) => {
  const result = await query(
    `SELECT u.id, u.username, u.email, u.avatar_url, u.bio, u.role, u.created_at,
       COUNT(DISTINCT a.id) AS analysis_count,
       COUNT(DISTINCT f1.following_id) AS following_count,
       COUNT(DISTINCT f2.follower_id) AS follower_count
     FROM users u
     LEFT JOIN analyses a ON a.user_id = u.id
     LEFT JOIN follows f1 ON f1.follower_id = u.id
     LEFT JOIN follows f2 ON f2.following_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [req.user.id]
  );
  res.json(result.rows[0]);
};

export const updateProfile = async (req, res, next) => {
  try {
    const { bio, username } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (bio !== undefined) { updates.push(`bio = $${idx++}`); values.push(bio); }
   if (username) {
  if (!/^[a-zA-Z0-9_]{3,40}$/.test(username)) {
    return res.status(400).json({
      error: 'Username must be 3-40 characters'
    });
  }

  const usernameExists = await query(
    'SELECT id FROM users WHERE username = $1 AND id != $2',
    [username.toLowerCase(), req.user.id]
  );

  if (usernameExists.rows.length > 0) {
    return res.status(409).json({
      error: 'Username already taken'
    });
  }

  updates.push(`username = $${idx++}`);
  values.push(username.toLowerCase());
}
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

    updates.push(`updated_at = NOW()`);
    values.push(req.user.id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, username, email, avatar_url, bio, role`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image uploaded'
      });
    }

    const result = await uploadImage(
      req.file.buffer,
      {
        folder: 'cineassist/avatars'
      }
    );

    const userResult = await query(
      `
      UPDATE users
      SET avatar_url = $1
      WHERE id = $2
      RETURNING id, username, email, avatar_url, bio, role
      `,
      [result.secure_url, req.user.id]
    );

   console.log(result.secure_url);
    res.json(userResult.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    await query(
      'DELETE FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      message: 'Account deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};
