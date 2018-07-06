import { Component, AfterViewInit, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'arlas-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private translate: TranslateService, private router: Router) {
    this.translate.setDefaultLang('fr');
  }

  public selectedTab(e) {
    switch (e.index) {
      case 0:
        this.router.navigateByUrl('/map');
        break;
      case 1:
        this.router.navigateByUrl('/donut');
        break;
      case 2:
        this.router.navigateByUrl('/histogram');
        break;
      case 3:
        this.router.navigateByUrl('/powerbars');
        break;
      case 4:
        this.router.navigateByUrl('/list');
        break;
      default:
        console.log('material-design-mdtabs-with-router');
        break;
    }
  }
}


