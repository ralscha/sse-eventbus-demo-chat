import {Component} from '@angular/core';
import {NavController} from '@ionic/angular';
import {ChatService} from '../../services/chat.service';
import {Room} from '../../models/room';

@Component({
  selector: 'app-room',
  templateUrl: './room.page.html',
  styleUrls: ['./room.page.scss'],
})
export class RoomPage {

  constructor(private readonly navCtrl: NavController,
              readonly chatService: ChatService) {
  }

  addRoom() {
    this.navCtrl.goForward('/add-room', true, {skipLocationChange: true});
  }

  joinRoom(room: Room) {
    this.navCtrl.goForward(`/messages/${room.id}`);
  }

  async exit() {
    sessionStorage.removeItem('username');
    await this.chatService.signout();
    this.navCtrl.goRoot('/signin');
  }

}
