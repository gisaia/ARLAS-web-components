import { Subject } from 'rxjs/Subject';

export enum SortEnum {
  asc, desc
}

export interface DetailedDataRetriever {
  /**
   * getData : retrieves the detailed data of a specific ite
  @params :  identifier: string  (the item identifier)  */
  getData(identifier: string): Subject<{fieldName: string, fieldValue: string | number | Date }>;
}
