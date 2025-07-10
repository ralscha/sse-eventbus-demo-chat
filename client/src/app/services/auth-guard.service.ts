import {Observable} from 'rxjs';
import {inject, Injectable} from '@angular/core';
import {ChatService} from './chat.service';
import {NavController} from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  private readonly chatService = inject(ChatService);
  private readonly navCtrl = inject(NavController);


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
