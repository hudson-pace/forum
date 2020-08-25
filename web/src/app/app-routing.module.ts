import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthGuard } from './helpers/auth-guard'
import { CreatePostComponent } from './create-post/create-post.component';
import { ForumComponent } from './forum/forum.component';
import { PostPageComponent } from './post-page/post-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserPageComponent } from './user-page/user-page.component';


const routes: Routes = [
  { path: '', component: ForumComponent },
  { path: 'create-post', component: CreatePostComponent, canActivate: [ AuthGuard ] },
  { path: 'posts/:id', component: PostPageComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'users/:username', component: UserPageComponent },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
