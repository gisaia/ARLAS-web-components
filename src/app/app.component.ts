import { Component, AfterViewInit, OnInit, ViewChild, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'arlas-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public activeLinkIndex = 0;
  public navLinks = [
    '/',
    '/donut',
    '/histogram',
    '/powerbars',
    '/list'
  ];

  constructor(private translate: TranslateService, private router: Router) {
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


