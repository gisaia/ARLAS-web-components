/**
 * Should be iso with the fieldList of ResultListContributor fieldList attribute
 */
export interface Field {
  /** Name/path of the field to add to list **/
  fieldName: string;
  /**  Name of the field that will be displayed on the list column **/
  columnName: string;
  /** Unit of the field values if it exists (degree, percentage, etc) **/
  dataType: string;
  /** Whether to colorize values on cells of the list with a color generated from the field value **/
  useColorService?: boolean;
  /** Whether the field represents a hybrid field **/
  isHybrid?: boolean;
  /** If this field is an hybrid title **/
  isHybridTitle?: boolean;
  /** Whether to display an icon or note **/
  icon?: string;
};
