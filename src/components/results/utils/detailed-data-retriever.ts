
import { Action } from '../utils/results.utils';
import { Observable } from 'rxjs';


export interface DetailedDataRetriever {

  getData(identifier: string): Observable<{ details: Map<string, Map<string, string>>, actions: Array<Action> }>;

}
