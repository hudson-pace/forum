export interface Comment {
  author: string;
  text: string;
  datePosted: string;
  votes: number;
  id: string;
  parent: string;
  children: Comment[];
  hasBeenUpvoted: boolean;
}