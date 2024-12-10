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

import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { MapboxAoiDrawService } from './draw/draw.service';
import { MapglComponent } from './mapgl.component';

describe('MapglComponent', () => {
  let component: MapglComponent;
  let fixture: ComponentFixture<MapglComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    declarations: [MapglComponent],
    imports: [TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } }),
        MatIconModule,
        MatButtonModule,
        MatSelectModule,
        MatRadioModule,
        MatSnackBarModule,
        MatSlideToggleModule,
        MatTooltipModule,
        MatChipsModule,
        DragDropModule],
    providers: [
        HttpClient,
        MapboxAoiDrawService,
        provideHttpClient(withInterceptorsFromDi())
    ]
})
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapglComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
