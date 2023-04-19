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

import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Action, Column, FieldsConfiguration, ModeEnum, ResultListComponent,
  ResultListOptions, SortEnum } from '../../../projects/arlas-components/src/public-api';
import { DetailedDataRetrieverImp } from './utils/detailed-data-retriever';


@Component({
  selector: 'arlas-results-demo',
  templateUrl: './results-demo.component.html',
  styleUrls: ['./results-demo.component.css']
})
export class ResultsDemoComponent implements OnInit {

    @ViewChild('resultlist', { static: false }) public resultListComponent: ResultListComponent;

    public data: Array<Map<string, string | number | Date>>;
    public fieldsList: Array<{ columnName: string; fieldName: string; dataType: string; dropdown?: boolean; }>;
    public dropDownMapValues: Map<string, Observable<Array<string>>> = new Map<string, Observable<Array<string>>>();
    public fieldsConfiguration: FieldsConfiguration;
    public detailedDataRetriever: DetailedDataRetrieverImp = new DetailedDataRetrieverImp();
    public globalActionsList = new Array<Action>();
    public count = 0;
    public modeEnum = ModeEnum;
    public options: ResultListOptions = new ResultListOptions();
    public activeSort: Column;

    public constructor() { }

    public ngOnInit() {
      this.options.showActionsOnhover = true;
      this.options.hideDetailIconName = 'keyboard_arrow_up';
      this.options.showDetailIconName = 'keyboard_arrow_down';
      this.fieldsConfiguration = {
        idFieldName: 'id', urlImageTemplate:
        'urlImage', urlThumbnailTemplate: 'urlImage', titleFieldNames: [{ fieldPath: 'source', process: '' }]
      };
      this.fieldsList = new Array<{ columnName: string; fieldName: string; dataType: string; dropdown?: boolean; }>();

      this.fieldsList.push({ columnName: 'Source', fieldName: 'source', dataType: '', dropdown: true });
      this.fieldsList.push({ columnName: 'Acquired', fieldName: 'acquired', dataType: '', dropdown: true });
      this.fieldsList.push({ columnName: 'Cloud', fieldName: 'cloud', dataType: '%', dropdown: true });
      this.fieldsList.push({ columnName: 'Incidence', fieldName: 'incidence', dataType: '°' });
      this.fieldsList.push({ columnName: 'Id', fieldName: 'id', dataType: '' });


      this.dropDownMapValues.set('source', from([['source_1', 'source_2', 'source_3']]));
      this.dropDownMapValues.set('acquired', from([['acquired_1', 'acquired_2', 'acquired_3']]));
      this.dropDownMapValues.set('cloud', from([['cloud_1', 'cloud_2', 'cloud_3']]));



      this.globalActionsList.push({ id: '1', label: 'Download', actionBus: null, tooltip: 'Download' });
      this.data = new Array<Map<string, string | number | Date>>();
      for (let i = 0; i < 50; i++) {
        const map = new Map<string, string | number | Date>();
        map.set('source', 'SPOT' + (i + 1));
        map.set('acquired', '2017-0' + (i + 1) + '-' + (i + 3));
        map.set('cloud', (i + 1) + '.0');
        if (i % 2 === 0) {
          map.set('urlImage', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-9QP6CIX2F41m5fztAivya8_JPWTFqdYQg345dJXl4E1Q0JYEMQ');
        } else {
          map.set('urlImage', 'http://www.un-autre-regard-sur-la-terre.org/document/blogUARST/Satellites/' +
          'Pleiades%20-%20La%20suite/Airbus%20-%20Si%C3%A8ge%20Groupe%20-%20Toulouse%20-%20Pl%C3%A9iades%2'
          + '0-%20VHR%20-%20Tr%C3%A8s%20haute%20r%C3%A9solution%20-%20satellite.JPG');

        }
        map.set('incidence', (i + 10));
        map.set('id', (i + 10) + 'd');
        this.data.push(map);
      }
    }

    public addMoreData() {
      setTimeout(() => {
        if (this.count < 2) {
          for (let i = 50; i < 100; i++) {
            const map = new Map<string, string | number | Date>();
            map.set('source', 'SPOT' + (i + 1));
            map.set('acquired', '2017-0' + (i + 1) + '-' + (i + 3));
            map.set('cloud', (i + 1) + '.0');
            map.set('incidence', (i + 10));
            map.set('id', (i + (this.count + 1) * 100) + '');
            this.data.push(map);
          }
          this.count++;
        } else {
          this.data = new Array<Map<string, string | number | Date>>();
          for (let i = 50; i < 150; i++) {
            const map = new Map<string, string | number | Date>();
            map.set('source', 'SPOT' + (i + 1));
            map.set('acquired', '2017-0' + (i + 1) + '-' + (i + 3));
            map.set('cloud', (i + 1) + '.0');
            map.set('incidence', (i + 10));
            map.set('id', (i + (this.count + 1) * 1000) + '');
            this.data.push(map);
          }
          this.count++;
        }
      }, 1000);
    }

    public updateData() {
      this.data = new Array<Map<string, string | number | Date>>();
      setTimeout(() => {
        this.data = new Array<Map<string, string | number | Date>>();
        for (let i = 0; i < 50; i++) {
          const map = new Map<string, string | number | Date>();
          map.set('source', 'SPOT' + (i + 1));
          map.set('acquired', '2017-0' + (i + 1) + '-' + (i + 3));
          map.set('cloud', (i + 1) + '.0');
          map.set('incidence', (i + 10));
          map.set('id', (i + 10) + 'd');
          this.data.push(map);
        }
      }, 1000);
    }

    public addData() {
      const map = new Map<string, string | number | Date>();
      map.set('source', 'SPOT' + (5 + 1));
      map.set('acquired', '2017-0' + (5 + 1) + '-' + (5 + 3));
      map.set('cloud', (5 + 1) + '.0');
      map.set('incidence', (5 + 10));
      map.set('id', (5 + 10));
      this.data.push(map);
    }

    public newColumns() {
      this.fieldsList = new Array<{ columnName: string; fieldName: string; dataType: string; }>();
      this.fieldsList.push({ columnName: 'Src', fieldName: 'source', dataType: '' });
      this.fieldsList.push({ columnName: 'Acquiered', fieldName: 'acquired', dataType: '' });
      this.fieldsList.push({ columnName: 'Cloud', fieldName: 'cloud', dataType: '%' });
      this.fieldsList.push({ columnName: 'Angle', fieldName: 'incidence', dataType: '°' });
      this.fieldsList.push({ columnName: 'Test1', fieldName: 'test_1', dataType: '°' });
      this.fieldsList.push({ columnName: 'Test2', fieldName: 'test_2', dataType: '°C' });
      this.fieldsList.push({ columnName: 'Test3', fieldName: 'test_3', dataType: '°C' });
      this.fieldsList.push({ columnName: 'Id', fieldName: 'id', dataType: '' });

      this.data = new Array<Map<string, string | number | Date>>();
      for (let i = 0; i < 5; i++) {
        const map = new Map<string, string | number | Date>();
        map.set('source', 'SPOT' + (i + 1));
        map.set('acquired', '2017-0' + (i + 1) + '-' + (i + 3));
        map.set('cloud', (i + 1) + '.0');
        map.set('test_1', (i + 10));
        map.set('test_2', (i * 2 + 10));
        map.set('test_3', (i * 2 + 10));
        map.set('incidence', (i + 10));
        map.set('id', (i + 10));
        this.data.push(map);
      }
    }

    public setFilters(fieldsToFilter: Map<string, string | number | Date>) {
      setTimeout(() => {
        if (this.count < 2) {
          for (let i = 50; i < 100; i++) {
            const map = new Map<string, string | number | Date>();
            map.set('source', 'SPOT' + (i + 1));
            map.set('acquired', '2017-0' + (i + 1) + '-' + (i + 3));
            map.set('cloud', (i + 1) + '.0');
            map.set('incidence', (i + 10));
            map.set('id', (i + (this.count + 1) * 100) + '');
            this.data.push(map);
          }
          this.count++;
        } else {
          this.data = new Array<Map<string, string | number | Date>>();
          for (let i = 50; i < 60; i++) {
            const map = new Map<string, string | number | Date>();
            map.set('source', 'SPOT' + (i + 1));
            map.set('acquired', '2017-0' + (i + 1) + '-' + (i + 3));
            map.set('cloud', (i + 1) + '.0');
            map.set('incidence', (i + 10));
            map.set('id', (i + (this.count + 1) * 1000) + '');
            this.data.push(map);
          }
          this.count++;
        }
      }, 1000);
    }

    public setSort() {
      const column = new Column('Cloud', 'cloud', '%');
      column.sortDirection = SortEnum.asc;
      this.activeSort = column;
    }

}
