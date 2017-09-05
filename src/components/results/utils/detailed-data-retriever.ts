
import { Action } from '../utils/results.utils';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';


export interface DetailedDataRetriever {

  getData(identifier: string): Observable<{ details: Map<string, Map<string, string>>, actions: Array<Action> }>;

}
