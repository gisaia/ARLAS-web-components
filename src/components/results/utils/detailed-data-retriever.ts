
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';


export interface DetailedDataRetriever {

  getData(identifier: string): Observable<{details: Map<string, string>,
                                           actions: Array<{id: string, label: string,
                                                          actionBus: Subject<{idFieldName: string, idValue: string}>}>}>;

}
