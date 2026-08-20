
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

import { Action, AdditionalInfo, Attachment, DetailedDataRetriever, Item, MatchInfo } from 'arlas-web-components';
import { Observable, from, of } from 'rxjs';
import { Task, TaskStatus } from '../../../../projects/arlas-components/src/lib/components/results/utils/aias-process';
import { Detail } from '../../../../projects/arlas-components/src/lib/components/results/utils/detailed-data-retriever';
import { ActionFilter } from '../../../../projects/arlas-components/src/lib/components/results/utils/results.utils';


export class DetailedDataRetrieverImp implements DetailedDataRetriever {
  public detailsConfig: Detail[] = [
    {
      name: 'Test',
      order: 0,
      fields: [
        {
          path: 'country',
          label: 'Country',
          process: ''
        }
      ]
    }
  ];

  public getValues(identifier: string, fields: string[]): Observable<string[]> {
    return of([]);
  }

  public getActions(item: Item): Observable<Array<Action>> {
    const actionsList = new Array<Action>();
    actionsList.push(
      { id: '1', label: 'Show', tooltip: 'Show', cssClass: 'CASSCLAS', icon: 'eye_tracking', reverseAction: { id: 'r', label: 'Hide', icon: 'visibility_off' }, fields: [] },
      { id: '2', label: 'Télécharger le produit', actionBus: undefined, tooltip: 'Download', icon: 'download' },
      { id: '3', label: 'WMTS', actionBus: undefined, tooltip: 'WMTS' },
      { id: '4', label: 'WMTS', actionBus: undefined, tooltip: 'WMTS', icon: 'satellite_alt' },
      { id: '5', label: 'WMTS', actionBus: undefined, tooltip: 'WMTS', icon: 'satellite_alt' }
    );
    return from(new Array(actionsList));
  }

  public getData(identifier: string): Observable<AdditionalInfo> {
    const detailsDataMap = new Map<string, Map<string, string>>();

    for (let i = 0; i < 10; i++) {
      const detailedDataMapGroup = new Map<string, string>();
      detailedDataMapGroup.set('country', 'France');
      detailedDataMapGroup.set('Resolution', '41000x16000');
      detailsDataMap.set(`Group ${i}`, detailedDataMapGroup);
    }

    const actionsList = new Array<Action>();
    actionsList.push({ id: '1', label: 'Show', tooltip: 'Show', cssClass: 'CASSCLAS', show: true },
      { id: '2', label: 'Download', actionBus: undefined, tooltip: 'Download', show: true },
      { id: '3', label: 'WMTS', actionBus: undefined, tooltip: 'WMTS', show: true });

    const attachments = new Array<Attachment>();
    attachments.push({
      icon: 'list',
      label: 'Gisaia',
      url: 'gisaia.fr',
      description: "Developpeur d'ARLAS",
    }, {
      url: 'arlas.io',
    });

    return from(new Array({ details: detailsDataMap, actions: actionsList, attachments: attachments } as AdditionalInfo));
  }

  public getMatch(identifier: string, filters: ActionFilter[][]): Observable<MatchInfo> {
    return of({ matched: filters.map((v, idx) => idx < filters.length / 2), data: {} });
  }

  public getTasks(identifier: string): Observable<Task[]> {
    const tasks: Task[] = [
      {
        processID: 'enrich',
        type: 'process',
        jobID: '',
        status: TaskStatus.successful,
        message: '',
        created: 1751551011,
        started: 1751551011,
        finished: 1751551021,
        resourceID: identifier
      },
      {
        processID: 'ingest',
        type: 'process',
        jobID: '',
        status: TaskStatus.accepted,
        message: '',
        created: 1751551011,
        started: 1751551011,
        finished: 1751551021,
        resourceID: identifier
      },
      {
        processID: 'dc3build',
        type: 'process',
        jobID: '',
        status: TaskStatus.failed,
        message: '',
        created: 1751551200,
        started: 1751551200,
        finished: 1751551221,
        resourceID: identifier
      }
    ];

    return of(tasks);
  }
}
