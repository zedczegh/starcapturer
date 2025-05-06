
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  read: boolean;
  status?: 'sent' | 'failed' | 'read';
  sender_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export interface ConversationPartner {
  id: string;
  username: string | null;
  avatar_url: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}
