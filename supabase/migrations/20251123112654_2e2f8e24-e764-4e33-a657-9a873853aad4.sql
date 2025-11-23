-- Add support for message replies
ALTER TABLE user_messages 
ADD COLUMN IF NOT EXISTS parent_message_id uuid REFERENCES user_messages(id) ON DELETE CASCADE;

-- Add soft delete support for messages
ALTER TABLE user_messages 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_messages_parent_id ON user_messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_deleted_at ON user_messages(deleted_at) WHERE deleted_at IS NULL;

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES user_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'heart', 'smile', 'reply')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Enable RLS on message_reactions
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_reactions
CREATE POLICY "Users can view reactions on their messages"
ON message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_messages 
    WHERE user_messages.id = message_reactions.message_id 
    AND (user_messages.sender_id = auth.uid() OR user_messages.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can add reactions to messages they can see"
ON message_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM user_messages 
    WHERE user_messages.id = message_reactions.message_id 
    AND (user_messages.sender_id = auth.uid() OR user_messages.receiver_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their own reactions"
ON message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Update RLS policy for user_messages to allow soft deletion
CREATE POLICY "Users can delete their own messages"
ON user_messages FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (
  auth.uid() = sender_id 
  AND (deleted_at IS NOT NULL OR read = true)
);

-- Add comment for clarity
COMMENT ON COLUMN user_messages.parent_message_id IS 'Reference to parent message for replies';
COMMENT ON COLUMN user_messages.deleted_at IS 'Timestamp when message was deleted (soft delete)';
COMMENT ON TABLE message_reactions IS 'Stores emoji reactions to messages';