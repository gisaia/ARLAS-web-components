
import { Observable } from 'rxjs/Observable';
import { DetailedItem } from './detailedItem';

export interface DetailedDataRetriever {

  getData(identifier: string): Observable<{details: Map<string, string>, actions: Array<string>}>;

}
