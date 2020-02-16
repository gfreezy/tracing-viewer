import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {TraceListComponent} from './trace-list/trace-list.component';
import {HttpClientModule} from '@angular/common/http';
import {TraceDetailComponent} from './trace-detail/trace-detail.component';
import {create} from 'rxjs-spy';
import { CallPipe } from './call.pipe';
@NgModule({
  declarations: [
    AppComponent,
    TraceListComponent,
    TraceDetailComponent,
    CallPipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RouterModule.forRoot([
      {path: 'traces', component: TraceListComponent},
      {path: 'traces/:id', component: TraceDetailComponent}
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}

create();
