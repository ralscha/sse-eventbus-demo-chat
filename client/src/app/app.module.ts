import {BrowserModule} from '@angular/platform-browser';
import {ErrorHandler, NgModule} from '@angular/core';
import {IonicApp, IonicErrorHandler, IonicModule} from 'ionic-angular';
import {MyApp} from './app.component';
import {HomePage} from '../pages/home/home';
import {AddRoomPage} from "../pages/add-room/add-room";
import {SigninPage} from "../pages/signin/signin";
import {RoomPage} from "../pages/room/room";
import {ChatService} from '../providers/chat-service';
import {EmojiPickerComponent} from "../components/emoji-picker/emoji-picker";
import {RelativeTime} from "../pipes/realative-time";

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    AddRoomPage,
    RoomPage,
    SigninPage,
    EmojiPickerComponent,
    RelativeTime
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    AddRoomPage,
    RoomPage,
    SigninPage
  ],
  providers: [
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    ChatService
  ]
})
export class AppModule {
}
