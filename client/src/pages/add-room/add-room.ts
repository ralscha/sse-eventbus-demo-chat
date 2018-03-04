import {Component} from '@angular/core';
import {NavController} from 'ionic-angular';
import {ChatService} from "../../providers/chat-service";

@Component({
  selector: 'page-add-room',
  templateUrl: 'add-room.html',
})
export class AddRoomPage {

  roomname: string;

  constructor(private readonly navCtrl: NavController,
              private readonly chatService: ChatService) {
  }

  async addRoom() {
    await this.chatService.addRoom(this.roomname);
    this.navCtrl.pop();
  }

}
