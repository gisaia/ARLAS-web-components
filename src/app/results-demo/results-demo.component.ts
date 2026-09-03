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

import { Component, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatSidenav, MatSidenavContainer } from '@angular/material/sidenav';
import {
  Action, CardFieldConfig, Column, FieldsConfiguration, ItemDataType, ResultListComponent,
  ResultlistModeEnum, ResultListOptions, SortedColumn, SortEnum, TableFieldConfig
} from 'arlas-web-components';
import moment from 'moment';
import { Observable, of } from 'rxjs';
import { buildCardItemField, buildTableItemField } from '../../../projects/arlas-components/src/lib/pipes/get-item-data-value/get-item-data-value.pipe';
import { DetailedDataRetrieverImp } from './utils/detailed-data-retriever';

function generateRandomText(length: number) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomText = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    randomText += charset[randomIndex];
  }

  return randomText;
}

const sourceField = { columnName: 'Source', fieldName: 'source', dataType: '',
  prettyName: 'Source', isTitle: true, lineNumber: 0 };
const acquiredField = { columnName: 'Acquired', fieldName: 'acquired', dataType: '',
  prettyName: 'Acquired', icon: 'alarm', isTitle: false, lineNumber: 0 };
const cloudField = { columnName: 'Cloud', fieldName: 'cloud', dataType: '%',
  prettyName: 'Cloud Cover', isTitle: false, lineNumber: 0};
const incidenceField = { columnName: 'Incidence', fieldName: 'incidence', dataType: '°',
  prettyName: 'Incidence Angle', isTitle: false, lineNumber: 0};
const idField = { columnName: 'Id', fieldName: 'id', dataType: '',
  prettyName: 'Id', isTitle: false, lineNumber: 0};

@Component({
    selector: 'arlas-results-demo',
    templateUrl: './results-demo.component.html',
    styleUrls: ['./results-demo.component.css'],
    imports: [MatSidenavContainer, MatSidenav, MatButton, ResultListComponent]
})
export class ResultsDemoComponent {
    public data: Array<Map<string, ItemDataType>>;
    public fieldsList: Array<TableFieldConfig>;
    public cardFields: Array<CardFieldConfig> = [];
    public dropDownMapValues: Map<string, Observable<Array<string>>> = new Map<string, Observable<Array<string>>>();
    public fieldsConfiguration: FieldsConfiguration;
    public detailedDataRetriever: DetailedDataRetrieverImp = new DetailedDataRetrieverImp();
    public globalActionsList = new Array<Action>();
    public count = 0;
    public modeEnum = ResultlistModeEnum;
    public options = new ResultListOptions();
    public activeSort: SortedColumn | undefined;

    public isListOpen = signal(true);

    public constructor() {
      this.options.showActionsOnhover = true;
      this.options.hideDetailIconName = 'keyboard_arrow_up';
      this.options.showDetailIconName = 'keyboard_arrow_down';
      this.fieldsConfiguration = {
        idFieldName: 'id',
        // urlImageTemplate: 'assets/logo-gisaia.png', // Old configuration
        urlImageTemplates: [ // Newer configuration
          {
            description: 'Satellite',
            url:'{urlImage}'
          },
          {
            description:'Gisaïa',
            url: 'assets/logo-gisaia.png',
            filter: {
              field: 'source',
              values: ['Pleiades']
            }
          }
        ],
        urlThumbnailTemplate: '{urlImage}',
        titleFieldNames: [{ fieldPath: 'source', process: '' }],
        useHttpQuicklooks: false,
        iconColorFieldName: 'source'
      };

      this.fieldsList = [];
      this.cardFields = [];

      this.fieldsList.push(sourceField, acquiredField, cloudField, incidenceField, idField);
      this.cardFields.push(sourceField, acquiredField, cloudField, incidenceField, idField);

      const descriptionField = { prettyName: 'Description', fieldName: 'description', dataType: '', isTitle: false, lineNumber: 0 };
      const gsdField = { prettyName: 'Ground Resolution', fieldName: 'groundResolution', dataType: 'm', icon: 'rules', isTitle: true, lineNumber: 0 };
      const sunAzimuthField = { prettyName: 'Sun Azimuth', fieldName: 'sunAzimuth', dataType: '°', isTitle: false, lineNumber: 0, icon: 'sunny' };
      const sunElevationField = { prettyName: 'Sun Elevation', fieldName: 'sunElevation', dataType: '°', isTitle: false, lineNumber: 0, icon: 'sunny' };
      const satelliteAzimuthField = { prettyName: 'Satellite Azimuth', fieldName: 'satelliteAzimuth', dataType: '°', isTitle: false, lineNumber: 0, icon: 'satellite_alt' };
      const offNadirAngleField = { prettyName: 'Off-nadir Angle', fieldName: 'offNadirAngle', dataType: '°', isTitle: false, lineNumber: 1 };
      const bandsField = { prettyName: 'Spectral Bands', fieldName: 'spectralBands', dataType: '', isTitle: false, lineNumber: 1 };
      const sceneWidthField = { prettyName: 'Scene Width', fieldName: 'sceneWidth', dataType: 'km', isTitle: false, lineNumber: 1 };
      const sceneHeightField = { prettyName: 'Scene Height', fieldName: 'sceneHeight', dataType: 'km', isTitle: false, lineNumber: 1 };
      const orbitDirectionField = { prettyName: 'Orbit Direction', fieldName: 'orbitDirection', dataType: '', isTitle: false, lineNumber: 1 };
      const processingLevelField = { prettyName: 'Processing Level', fieldName: 'processingLevel', dataType: '', isTitle: false, lineNumber: 3 };
      const accuracyField = { prettyName: 'Radiometric Accuracy', fieldName: 'radiometricAccuracy', dataType: '%', isTitle: false, lineNumber: 3 };
      const snowCoverField = { prettyName: 'Snow Cover', fieldName: 'snowCover', dataType: '%', isTitle: false, lineNumber: 3 };
      const elevationField = { prettyName: 'Target Elevation', fieldName: 'targetElevation', dataType: 'm', isTitle: false, lineNumber: 3 };
      const qualityField = { prettyName: 'Image Quality', fieldName: 'imageQuality', dataType: '/10', isTitle: false, lineNumber: 3 };

      this.cardFields.push(
        descriptionField, gsdField, sunAzimuthField, sunElevationField, satelliteAzimuthField,
        offNadirAngleField, bandsField, sceneWidthField, sceneHeightField, orbitDirectionField,
        processingLevelField, accuracyField, snowCoverField, elevationField, qualityField);

      this.dropDownMapValues.set(sourceField.fieldName, of(['source_1', 'source_2', 'source_3']));
      this.dropDownMapValues.set(acquiredField.fieldName, of(['acquired_1', 'acquired_2', 'acquired_3']));
      this.dropDownMapValues.set(cloudField.fieldName, of(['cloud_1', 'cloud_2', 'cloud_3']));

      const SPECTRAL_BANDS = ['PAN', 'RGB', 'RGBN', 'RGBNE', 'MS4', 'MS8', 'SWIR', 'PAN+MS'];
      const PROCESSING_LEVELS = ['L1A', 'L1B', 'L2A', 'L3A', 'Ortho'];
      const ORBIT_DIRECTIONS = ['Ascending', 'Descending'];

      const randFloat = (min: number, max: number, dec = 1) =>
        Number.parseFloat((Math.random() * (max - min) + min).toFixed(dec));
      const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
      const pick = (arr: any[]) => arr[randInt(0, arr.length - 1)];

      this.globalActionsList.push({ id: '1', label: 'Download', actionBus: undefined, tooltip: 'Download', icon: 'download' });
      this.data = new Array();
      for (let i = 0; i < 50; i++) {
        const map = new Map<string, ItemDataType>();
        this.setValue(map, acquiredField, this.computeDate(i));
        this.setValue(map, cloudField, (i + 1) + '.0');
        this.setValue(map, idField, (i + 10) + 'd');
        this.setValue(map, incidenceField, i + 10);

        map.set('imageEnabled', 'true');
        map.set('thumbnailEnabled', 'true');

        this.setValue(map, descriptionField, generateRandomText(Math.floor(Math.random() * 30)));
        this.setValue(map, sunAzimuthField, randFloat(0, 360));
        // Check that the icon is displayed even with no data
        if (i % 5 !== 0) {
          this.setValue(map, sunElevationField, randFloat(20, 75));
        }
        this.setValue(map, satelliteAzimuthField, randFloat(0, 360));
        this.setValue(map, offNadirAngleField, randFloat(0, 30));
        this.setValue(map, bandsField, pick(SPECTRAL_BANDS));
        this.setValue(map, accuracyField, randFloat(85, 99));
        this.setValue(map, sceneWidthField, randFloat(10, 120, 1));
        this.setValue(map, sceneHeightField, randFloat(10, 120, 1));
        this.setValue(map, orbitDirectionField, pick(ORBIT_DIRECTIONS));
        this.setValue(map, processingLevelField, pick(PROCESSING_LEVELS));
        this.setValue(map, elevationField, randInt(-100, 4500));
        this.setValue(map, snowCoverField, randFloat(0, 40));
        this.setValue(map, qualityField, randInt(5, 10));

        if (i % 2 === 0) {
          this.setValue(map, sourceField, 'Perusat');

          map.set(sourceField.fieldName + '_title', 'Perusat');
          map.set('urlImage', 'https://www.un-autre-regard-sur-la-terre.org/document/blogUARST/Satellites/' +
            'Per%f9sat/Per%faSAT-1%20-%20premi%e8res%20images%20-%20first%20images%20-%20Huamanga%20-%20Ayacucho%20-%20CONIDA%20-%202016.jpg');
        } else {
          this.setValue(map, sourceField, 'Pleiades');

          map.set(sourceField.fieldName + '_title', 'Pleiades');
          map.set('urlImage', 'http://www.un-autre-regard-sur-la-terre.org/document/blogUARST/Satellites/' +
            'Pleiades%20-%20La%20suite/Airbus%20-%20Si%C3%A8ge%20Groupe%20-%20Toulouse%20-%20Pl%C3%A9iades%2'
            + '0-%20VHR%20-%20Tr%C3%A8s%20haute%20r%C3%A9solution%20-%20satellite.JPG');
        }
        this.data.push(map);
      }
    }

    public addMoreData() {
      setTimeout(() => {
        if (this.count < 2) {
          for (let i = 50; i < 100; i++) {
            const map = new Map<string, ItemDataType>();
            this.setValue(map, sourceField, 'SPOT' + (i + 1));
            this.setValue(map, acquiredField, this.computeDate(i));
            this.setValue(map, cloudField, (i + 1) + '.0');
            this.setValue(map, idField, (i + (this.count + 1) * 100) + 'd');
            this.setValue(map, incidenceField, i + 10);
            this.data.push(map);
          }
          this.count++;
        } else {
          this.data = new Array();
          for (let i = 50; i < 150; i++) {
            const map = new Map<string, ItemDataType>();
            this.setValue(map, sourceField, 'SPOT' + (i + 1));
            this.setValue(map, acquiredField, this.computeDate(i));
            this.setValue(map, cloudField, (i + 1) + '.0');
            this.setValue(map, idField, (i + (this.count + 1) * 1000) + 'd');
            this.setValue(map, incidenceField, i + 10);
            this.data.push(map);
          }
          this.count++;
        }
      }, 1000);
    }

    public updateData() {
      setTimeout(() => {
        this.data = new Array();
        for (let i = 0; i < 50; i++) {
          const map = new Map<string, ItemDataType>();
          this.setValue(map, sourceField, 'SPOT' + (i + 1));
          this.setValue(map, acquiredField, this.computeDate(i));
          this.setValue(map, cloudField, (i + 1) + '.0');
          this.setValue(map, idField, (i + 10) + 'd');
          this.setValue(map, incidenceField, i + 10);
          this.data.push(map);
        }
      }, 1000);
    }

    public setFilters(fieldsToFilter: Map<string, ItemDataType>) {
      this.addMoreData();
    }

    public setSort() {
      const column = new Column('Cloud', 'cloud', '%');
      column.sortDirection = SortEnum.asc;
      this.activeSort = column;
    }

    private setValue(map: Map<string, ItemDataType>, field: any, value: ItemDataType) {
      map.set(buildCardItemField(field), value);
      map.set(buildTableItemField(field), value);
    }

    private computeDate(index: number) {
      const startDate = new Date(2017, 0, 1);
      return moment(startDate).add(index, 'days').toDate().toDateString();
    }
}
