import { Subject } from 'rxjs/Subject';


export interface Action {
  id: string;
  label: string;
  actionBus: Subject<{idFieldName: string, idValue: string}>;
}

export interface ProductIdentifier {
  idFieldName: string;
  idValue: string;
}

