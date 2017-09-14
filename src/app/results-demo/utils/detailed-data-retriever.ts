import { DetailedDataRetriever } from '../../../components/results/utils/detailed-data-retriever';
import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';
import { Action } from 'components';


export class DetailedDataRetrieverImp implements DetailedDataRetriever {


  public getData(identifier: string): Observable<{ details: Map<string, Map<string, string>>, actions: Array<Action> }> {
    const detailsDataMap = new Map<string, Map<string, string>>();

    const detailedDataMapGroup1 = new Map<string, string>();
    detailedDataMapGroup1.set('country', 'France');
    detailedDataMapGroup1.set('Resolution', '41000x16000');

    detailsDataMap.set('Group 1', detailedDataMapGroup1);
    const detailedDataMapGroup2 = new Map<string, string>();
    detailedDataMapGroup2.set('country', 'Allemagne');
    detailedDataMapGroup2.set('Resolution', '41000x16000');
    detailsDataMap.set('Group 2', detailedDataMapGroup2);


    const actionsList = new Array<{ id: string, label: string, actionBus: Subject<{ idFieldName: string, idValue: string }> }>();
    actionsList.push({ id: '1', label: 'Show', actionBus: null }, { id: '2', label: 'Download', actionBus: null });


    return Observable.from(new Array({ details: detailsDataMap, actions: actionsList }));

  }
}
