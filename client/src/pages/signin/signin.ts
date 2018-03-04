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

  nickname: string;

  enterNickname() {
    this.chatService.user = this.nickname;
    this.chatService.start();
    this.navCtrl.setRoot(RoomPage);
  }

}
