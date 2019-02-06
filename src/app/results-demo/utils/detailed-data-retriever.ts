
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

import { DetailedDataRetriever } from '../../../components/results/utils/detailed-data-retriever';
import { Observable, from } from 'rxjs';
import { Action } from 'components/results/utils/results.utils';


export class DetailedDataRetrieverImp implements DetailedDataRetriever {


  public getData(identifier: string): Observable<{ details: Map<string, Map<string, string>>, actions: Array<Action> }> {
    const detailsDataMap = new Map<string, Map<string, string>>();

    const detailedDataMapGroup1 = new Map<string, string>();
    detailedDataMapGroup1.set('country', 'France' + identifier);
    detailedDataMapGroup1.set('Resolution', '41000x16000');

    detailsDataMap.set('Group 1', detailedDataMapGroup1);
    const detailedDataMapGroup2 = new Map<string, string>();
    detailedDataMapGroup2.set('country', 'Allemagne ' + identifier);
    detailedDataMapGroup2.set('Resolution', '41000x16000');
    detailsDataMap.set('Group 2', detailedDataMapGroup2);


    const actionsList = new Array<Action>();
    actionsList.push({ id: '1', label: 'Show', tooltip: 'Show', cssClass: 'CASSCLAS'  },
      { id: '2', label: 'Download', actionBus: null, tooltip: 'Download' },
      { id: '3', label: 'WMTS', actionBus: null, tooltip: 'WMTS' });


    return from(new Array({ details: detailsDataMap, actions: actionsList }));

  }
}
