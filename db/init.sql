CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        UNIQUE NOT NULL,
  password      TEXT,
  google_id     TEXT,
  bio           TEXT        DEFAULT '',
  photo_url     TEXT        DEFAULT 'https://firebasestorage.googleapis.com/v0/b/social-app-834ec.appspot.com/o/Screenshot_2025-04-26_200917-removebg-preview.png?alt=media&token=ed309263-af79-4a99-bba1-13ee7ff0fa4a',
  fav_genres    TEXT[]      DEFAULT '{}',
  adult_content BOOLEAN     DEFAULT false,
  favorites     INTEGER[]   DEFAULT '{}',
  watchlist     JSONB       DEFAULT '[]',
  watched       JSONB       DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id      INTEGER     NOT NULL,
  is_movie      BOOLEAN     DEFAULT true,
  text          TEXT,
  spoiler_alert BOOLEAN     DEFAULT false,
  likes         INTEGER     DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS review_interactions (
  id         SERIAL PRIMARY KEY,
  review_id  INTEGER     NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id    INTEGER     NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  action     TEXT        DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_lists (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  movies      INTEGER[]   DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
