import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {RoomPage} from '../room/room';
import {ChatService} from "../../providers/chat-service";

@Component({
  selector: 'page-signin',
  templateUrl: 'signin.html',
})
export class SigninPage {

  constructor(private readonly navCtrl: NavController,
              private readonly chatService: ChatService) {
  }

  username: string;

  async enterUsername() {
    const ok = await this.chatService.signin(this.username);
    if (ok) {
      this.navCtrl.setRoot(RoomPage);
    }
    else {
      //TODO: show error message, username already in use
    }
  }

}
