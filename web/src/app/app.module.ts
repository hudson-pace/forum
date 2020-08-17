import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { appInitializer } from './helpers/app.initializer';
import { JwtInterceptor } from './helpers/jwt.interceptor';
import { ErrorInterceptor } from './helpers/error.interceptor';
import { AuthenticationService } from './services/authentication.service';
import { AppComponent } from './app.component';
import { UserPageComponent } from './user-page/user-page.component';
import { CommentComponent } from './comment/comment.component';
import { CreatePostComponent } from './create-post/create-post.component';
import { PostComponent } from './post/post.component';
import { PostPageComponent } from './post-page/post-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ForumComponent } from './forum/forum.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

@NgModule({
  declarations: [
    AppComponent,
    UserPageComponent,
    CommentComponent,
    CreatePostComponent,
    PostComponent,
    PostPageComponent,
    DashboardComponent,
    ForumComponent,
    LoginComponent,
    RegisterComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [
    { provide: APP_INITIALIZER, useFactory: appInitializer, multi: true, deps: [AuthenticationService] },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
