import { provideZoneChangeDetection } from "@angular/core";
import {PreloadAllModules, provideRouter, RouteReuseStrategy, withHashLocation, withPreloading} from '@angular/router';
import {bootstrapApplication} from '@angular/platform-browser';
import {AppComponent} from './app/app.component';
import {IonicRouteStrategy, provideIonicAngular} from '@ionic/angular/standalone';
import {routes} from "./app/app-routing.module";


bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),{provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
    provideIonicAngular(),
    provideRouter(routes, withHashLocation(), withPreloading(PreloadAllModules))
  ]
})
  .catch(err => console.error(err));
