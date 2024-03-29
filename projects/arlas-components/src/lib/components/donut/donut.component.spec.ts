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

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DonutComponent } from './donut.component';
import { ArlasColorService } from '../../services/color.generator.service';
import { AwcColorGeneratorLoader, ColorGeneratorLoader } from '../componentsUtils';
import { TranslateModule, TranslateLoader, TranslateFakeLoader } from '@ngx-translate/core';
import { ColorGeneratorModule } from '../../services/color.generator.module';

describe('DonutComponent', () => {
  let component: DonutComponent;
  let fixture: ComponentFixture<DonutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DonutComponent ],
      imports: [
        TranslateModule.forRoot({ loader: { provide: TranslateLoader, useClass: TranslateFakeLoader } }),
        ColorGeneratorModule.forRoot({
          loader: {
            provide: ColorGeneratorLoader,
            useClass: AwcColorGeneratorLoader
          }
        })
      ],
      providers: [
        ArlasColorService      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DonutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
