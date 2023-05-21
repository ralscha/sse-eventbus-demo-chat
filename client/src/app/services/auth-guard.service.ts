import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {ChatService} from './chat.service';
import {NavController} from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {

  constructor(private readonly chatService: ChatService, private readonly navCtrl: NavController) {
  }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {

    if (!this.chatService.isLoggedIn()) {
      const username = sessionStorage.getItem('username');
      if (username !== null) {
        return this.chatService.signin(username, true).then(ok => {
          if (!ok) {
            this.navCtrl.navigateRoot('/signin');
          }
          return ok;
        });
      } else {
        this.navCtrl.navigateRoot('/signin');
        return false;
      }
    }

    return true;
  }

}
