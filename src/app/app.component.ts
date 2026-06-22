/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Component, OnInit } from '@angular/core';
import { MatTab, MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'arlas-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    RouterOutlet, MatTab, MatTabGroup
  ]
})
export class AppComponent implements OnInit {
  public activeLinkIndex = 0;
  public navLinks = [
    '/',
    '/donut',
    '/histogram',
    '/powerbars',
    '/calendar-timeline',
    '/list',
    '/wmts-layer-manager',
    '/multi-collection',
    '/cog-visualisation',
    '/layer-legend'
  ];

  public constructor(private readonly translate: TranslateService, private readonly router: Router) {
    this.translate.setFallbackLang('fr');
  }

  public selectedTab(e: MatTabChangeEvent) {
    this.router.navigateByUrl(this.navLinks[e.index]);
  }

  public ngOnInit(): void {
    this.router.events.subscribe(() => {
      this.activeLinkIndex = this.navLinks.indexOf(this.router.url);
    });
  }
}


