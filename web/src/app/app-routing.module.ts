import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CreatePostComponent } from './create-post/create-post.component';
import { ForumComponent } from './forum/forum.component';


const routes: Routes = [
  { path: '', component: ForumComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
