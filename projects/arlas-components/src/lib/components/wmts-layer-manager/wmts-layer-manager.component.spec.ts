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

import { WmtsLayerManagerComponent } from './wmts-layer-manager.component';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClientModule, HttpClient } from '@angular/common/http';

describe('WmtsLayerManagerComponent', () => {
  let component: WmtsLayerManagerComponent;
  let fixture: ComponentFixture<WmtsLayerManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WmtsLayerManagerComponent ],
      imports: [
        MatDialogModule,
        HttpClientModule
      ],
      providers: [
        HttpClient
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WmtsLayerManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
