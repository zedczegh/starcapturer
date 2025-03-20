
export interface SharedAstroSpot {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  bortleScale?: number;
  siqsScore?: number;
  imageUrl?: string;
  owner?: {
    id: string;
    name: string;
    avatar?: string;
  };
  visibility: 'public' | 'private' | 'followers';
  timestamp: string; // Make this required to match the other SharedAstroSpot interface
  tags?: string[];
  likes?: number;
  views?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  distance?: number;
}
