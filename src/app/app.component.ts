import {Component} from '@angular/core';
import {TranslateService} from "@ngx-translate/core";
import {Router} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public activeLinkIndex = 0;
  public navLinks = [
    '/',
    '/donut',
    '/histogram',
    '/powerbars',
    '/calendar-timeline',
    '/list',
    '/wmts-layer-manager'
  ];

  public constructor(private translate: TranslateService, private router: Router) {
    this.translate.setDefaultLang('fr');
  }

  public selectedTab(e) {
    this.router.navigateByUrl(this.navLinks[e.index]);
  }

  public ngOnInit(): void {
    this.router.events.subscribe(() => {
      this.activeLinkIndex = this.navLinks.indexOf(this.navLinks.find(tab => tab === this.router.url));
    });
  }
}
