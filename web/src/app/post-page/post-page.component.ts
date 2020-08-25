import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ForumService } from '../services/forum.service';
import { Post } from '../models/post';
import { Comment } from '../models/comment';
import { FormGroup, FormControl } from '@angular/forms';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-post-page',
  templateUrl: './post-page.component.html',
  styleUrls: ['./post-page.component.css']
})
export class PostPageComponent implements OnInit {
  post: Post;
  postId: string;
  sortedComments: Comment[];
  commentForm = new FormGroup({
    text: new FormControl(''),
  });

  constructor(
    private route: ActivatedRoute,
    private forumService: ForumService,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.postId = params['id'];
      this.forumService.getPost(this.postId).subscribe(post => {
        this.post = post;
        this.sortedComments = this.sortComments(post.comments, post.id);
      });
    });
  }

  onSubmitComment(): void {
    this.forumService.createComment(this.commentForm.value.text, this.post.id).subscribe(data => {
      console.log(data);
    });
    this.commentForm.patchValue({ text: '' });
  }

  upvotePost(): void {
    this.forumService.upvotePost(this.post.id).subscribe(response => console.log(response));
  }

  sortComments(comments: Comment[], parent: string) {
    let children = [];
    for (let i = 0; i < comments.length; i++) {
      if (comments[i].parent === parent) {
        children.push(comments.splice(i, 1)[0]);
        i--;
      }
    }
    for (let i = 0; i < children.length; i++) {
      children[i].children = this.sortComments(comments, children[i].id);
    }
    return children;
  }
}
