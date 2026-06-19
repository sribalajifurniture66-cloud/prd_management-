-- Add color column to items table
ALTER TABLE items
ADD COLUMN color TEXT;

-- Create index for color if needed for filtering
CREATE INDEX IF NOT EXISTS idx_items_color ON items(color);
