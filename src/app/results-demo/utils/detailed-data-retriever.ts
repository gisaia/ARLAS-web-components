import { DetailedDataRetriever } from '../../../components/results/utils/detailed-data-retriever';
import { Observable } from 'rxjs/Rx';


export class DetailedDataRetrieverImp implements DetailedDataRetriever {


  public getData(identifier: string): Observable<{details: Map<string, string>, actions: Array<string>}> {
    const detailedDataMap = new Map<string, string>();
    detailedDataMap.set('country', 'France');
    detailedDataMap.set('Resolution', '41000x16000');
    console.log(detailedDataMap);

    const actionsList = new Array<string>();
    actionsList.push('Show on map', 'Download');
    return Observable.from(new Array({details: detailedDataMap, actions: actionsList}));
  }
}
