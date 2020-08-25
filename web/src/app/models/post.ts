import { Comment } from './comment';

export interface Post {
    text: string;
    author: string;
    tags: string[];
    datePosted: string;
    comments: Comment[];
    id: string;
    postId: string;
    hasBeenUpvoted: boolean;
    votes: number;
}