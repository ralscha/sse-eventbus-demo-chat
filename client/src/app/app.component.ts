import {Component} from '@angular/core';

import {SigninPage} from '../pages/signin/signin';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = SigninPage;

}

