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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ColorGeneratorModule } from '../../../services/color.generator.module';
import { ArlasColorService } from '../../../services/color.generator.service';
import { AwcColorGeneratorLoader, ColorGeneratorLoader } from '../../componentsUtils';
import { ResultScrollDirective } from '../result-directive/result-scroll.directive';
import { ResultListComponent } from './result-list.component';

describe('ResultListComponent', () => {
  let component: ResultListComponent;
  let fixture: ComponentFixture<ResultListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ResultListComponent, ResultScrollDirective],
      providers: [
        ArlasColorService
      ],
      imports: [
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } }),
        MatMenuModule,
        MatGridListModule,
        MatRadioModule,
        MatSelectModule,
        MatOptionModule,
        MatCheckboxModule,
        FormsModule,
        ColorGeneratorModule.forRoot({
          loader: {
            provide: ColorGeneratorLoader,
            useClass: AwcColorGeneratorLoader
          }
        })
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResultListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
