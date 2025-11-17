
export interface Comment {
  id: string;
  content: string;
  created_at: string;
  image_url?: string | null;
  image_urls?: string[] | null;
  user_id?: string;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  };
  parent_id?: string | null;
  replies?: Comment[];
  likeCount?: number;
  isLikedByCurrentUser?: boolean;
}

