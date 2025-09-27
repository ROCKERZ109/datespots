import { GeoPoint } from "firebase/firestore";

// types.ts
export interface DateSpot {
  id: string;
  name: string;
  location: string;
  category: 'outdoor' | 'indoor' | 'food' | 'culture' | 'adventure' | 'romantic' | 'water' | 'view' | 'entertainment';
  priceLevel: 1 | 2 | 3 | 4; // $, $$, $$$, $$$$
  description: string;
  rating: number; // 0-5
  totalVotes: number;
  // New voting fields
  upvotes: number;
  downvotes: number;
  tags: string[];
  imageUrl?: string;
  createdAt: Date;
  createdBy?: string;
  coordinates?: GeoPoint; //
   petFriendly?: boolean;
}
// types.ts
export interface Vote {
  id?: string;
  userId: string;
  dateSpotId: string;
  voteType: 'up' | 'down';
  createdAt: Date;
}