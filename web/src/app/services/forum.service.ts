import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Post } from '../models/post';

@Injectable({
  providedIn: 'root'
})
export class ForumService {

  constructor(
    private httpClient: HttpClient,
  ) { }

  createPost(text: string, tags: string) {
    return this.httpClient.post<any>(`${environment.apiUrl}/posts`, {
      text: text,
      tags: tags
    }, { withCredentials: true });
  }
  getAllPosts(tagList: string[]) {
    return this.httpClient.get<Post[]>(`${environment.apiUrl}/posts`, { params: { "tags": tagList } });
  }
  getPost(postId: string) {
    return this.httpClient.get<Post>(`${environment.apiUrl}/posts/post/${postId}`);
  }
  createComment(text:string, postId: string) {
    return this.httpClient.post<any>(`${environment.apiUrl}/posts/post/${postId}`, { text: text }, { withCredentials: true });
  }
  createCommentReply(text: string, commentId: string) {
    return this.httpClient.post<any>(`${environment.apiUrl}/posts/comment/${commentId}`, { text: text }, { withCredentials: true });
  }
  upvotePost(postId: string) {
    return this.httpClient.post<any>(`${environment.apiUrl}/posts/post/${postId}/upvote`, {}, { withCredentials: true });
  }
  undoPostUpvote(postId: string) {
    return this.httpClient.post<any>(`${environment.apiUrl}/posts/post/${postId}/undo-upvote`, {}, { withCredentials: true });
  }
  upvoteComment(commentId: string) {
    return this.httpClient.post<any>(`${environment.apiUrl}/posts/comment/${commentId}/upvote`, {}, { withCredentials: true });
  }
  undoCommentUpvote(commentId: string) {
    return this.httpClient.post<any>(`${environment.apiUrl}/posts/comment/${commentId}/undo-upvote`, {}, { withCredentials: true });
  }
}
