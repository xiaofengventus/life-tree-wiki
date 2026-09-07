PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS home_gallery_images (
  slot_number INTEGER PRIMARY KEY CHECK (slot_number BETWEEN 1 AND 10),
  content_hash TEXT NOT NULL UNIQUE,
  selected_by TEXT NOT NULL,
  selected_at TEXT NOT NULL,
  FOREIGN KEY (content_hash) REFERENCES media_assets(content_hash) ON DELETE CASCADE,
  FOREIGN KEY (selected_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_home_gallery_selected
  ON home_gallery_images(selected_at DESC);
