import { Subject } from 'rxjs/Subject';

export interface Action {
  id: string;
  label: string;
  actionBus?: Subject<{ idFieldName: string, idValue: string }>;
  cssClass?: string;
  tooltip?: string;
}

export interface ElementIdentifier {
  idFieldName: string;
  idValue: string;
}

export interface FieldsConfiguration {
  idFieldName: string;
  urlImageTemplate?: string;
  urlThumbnailTemplate?: string;
  titleFieldNames?: Array<Field>;
  tooltipFieldNames?: Array<Field>;
  imageEnabled?: boolean;
  thumbnailEnabled?: boolean;
  icon?: string;
  iconCssClass?: string;
}

export interface Field {
  fieldPath: string;
  process?: string;
}
