
import { Observable } from 'rxjs/Observable';

export interface DetailedDataRetriever {

  getData(identifier: string): Observable<{details: Map<string, string>, actions: Array<string>}>;

}
