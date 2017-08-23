import { DetailedDataRetriever } from '../../../components/results/utils/detailed-data-retriever';
import { Observable } from 'rxjs/Rx';
import { Subject } from 'rxjs/Subject';


export class DetailedDataRetrieverImp implements DetailedDataRetriever {


  public getData(identifier: string): Observable<{details: Map<string, string>,
    actions: Array<{id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>}>}> {
    const detailedDataMap = new Map<string, string>();
    detailedDataMap.set('country', 'France');
    detailedDataMap.set('Resolution', '41000x16000');
    const actionsList = new Array<{id: string, label: string, actionBus: Subject<{idFieldName: string, idValue: string}>}>();
    actionsList.push({id: '1', label: 'Show', actionBus: null}, {id: '2', label: 'Download', actionBus: null});
    return Observable.from(new Array({details: detailedDataMap, actions: actionsList}));
  }
}
