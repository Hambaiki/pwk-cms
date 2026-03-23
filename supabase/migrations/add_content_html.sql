-- Add contentHtml column to entries table
ALTER TABLE entries ADD COLUMN content_html text DEFAULT '';

-- Create index for faster queries
CREATE INDEX entries_content_html_idx ON entries (content_html);
