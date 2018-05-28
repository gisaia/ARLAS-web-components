import { Subject } from 'rxjs/Subject';

export interface Action {
  id: string;
  label: string;
  actionBus?: Subject<{ idFieldName: string, idValue: string }>;
  cssClass?: string;
}

export interface ElementIdentifier {
  idFieldName: string;
  idValue: string;
}

export interface FieldsConfiguration {
  idFieldName: string;
  urlImageTemplate?: string;
  urlThumbnailTemplate?: string;
  titleFieldName?: string;
}
