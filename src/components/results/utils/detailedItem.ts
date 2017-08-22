export class DetailedItem {

  public detailedData: Map<string, string>;
  public actionsList: Array<string>;

  constructor(detailedData: Map<string, string>, actionsList: Array<string> ) {
    this.detailedData = detailedData;
    this.actionsList = actionsList;
  }
}
