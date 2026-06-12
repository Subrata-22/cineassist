import { query } from './database.js';
import dotenv from 'dotenv';
dotenv.config();

const migrate = async () => {
  console.log('Running migrations...');

  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(40) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      avatar_url TEXT,
      bio TEXT DEFAULT '',
      role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      oauth_provider VARCHAR(20),
      oauth_id VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Analyses table
  await query(`
    CREATE TABLE IF NOT EXISTS analyses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) DEFAULT 'Untitled Shot',
      image_url TEXT NOT NULL,
      image_public_id TEXT,
      overall_score INTEGER NOT NULL,
      verdict VARCHAR(100),
      genre VARCHAR(50),
      mood VARCHAR(50),
      modules JSONB NOT NULL DEFAULT '[]',
      ai_feedback TEXT,
      ai_suggestions TEXT[],
      recomposition_crop JSONB,
      is_public BOOLEAN DEFAULT false,
      view_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Sequences table (film timeline)
  await query(`
    CREATE TABLE IF NOT EXISTS sequences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      analysis_ids UUID[] DEFAULT '{}',
      is_public BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Challenges table
  await query(`
    CREATE TABLE IF NOT EXISTS challenges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      theme VARCHAR(100),
      focus_module VARCHAR(100),
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Challenge submissions
  await query(`
    CREATE TABLE IF NOT EXISTS challenge_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
      note TEXT DEFAULT '',
      vote_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(challenge_id, user_id)
    );
  `);

  // Votes on challenge submissions
  await query(`
    CREATE TABLE IF NOT EXISTS submission_votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      submission_id UUID REFERENCES challenge_submissions(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(submission_id, user_id)
    );
  `);

  // Comments
  await query(`
    CREATE TABLE IF NOT EXISTS comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Follows (social)
  await query(`
    CREATE TABLE IF NOT EXISTS follows (
      follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
      following_id UUID REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (follower_id, following_id),
      CHECK (follower_id != following_id)
    );
  `);

  // Likes (on analyses)
  await query(`
    CREATE TABLE IF NOT EXISTS likes (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, analysis_id)
    );
  `);

  // Unique views per user
await query(`
  CREATE TABLE IF NOT EXISTS analysis_views (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, analysis_id)
  );
`);

  // Score history (for trend charts)
  await query(`
    CREATE TABLE IF NOT EXISTS score_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
      overall_score INTEGER,
      modules JSONB,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Notifications
await query(`
  CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`);

  // Indexes for performance
  await query(`CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_analyses_public ON analyses(is_public, created_at DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_analyses_score ON analyses(overall_score DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_comments_analysis ON comments(analysis_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_score_history_user ON score_history(user_id, recorded_at DESC);`);

  console.log('✅ Migrations complete.');
  process.exit(0);
};

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
