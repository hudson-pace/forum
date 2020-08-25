import { Component, OnInit, Input } from '@angular/core';
import { ForumService } from '../services/forum.service';
import { faCommentAlt, faThumbsUp } from '@fortawesome/free-solid-svg-icons';
import { Post } from '../models/post';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent implements OnInit {
  @Input() post: Post;
  faCommentAlt = faCommentAlt;
  faThumbsUp = faThumbsUp;
  date: Date;
  votes: number;
  hasBeenUpvoted: boolean;

  constructor(
    private forumService: ForumService,
  ) { }

  ngOnInit(): void {
    if (!this.post.author) {
      this.post.author = "[deleted]";
    }
    this.date = new Date(this.post.datePosted);
  }

  clickVoteButton(event): void {
    event.stopPropagation();
    if (this.post.hasBeenUpvoted) {
      this.forumService.undoPostUpvote(this.post.id).subscribe(response => {
        this.post.hasBeenUpvoted = response.hasBeenUpvoted;
        this.post.votes = response.votes;
      });
    }
    else {
      this.forumService.upvotePost(this.post.id).subscribe(response => {
        this.post.hasBeenUpvoted = response.hasBeenUpvoted;
        this.post.votes = response.votes;
      });
    }
  }

}
