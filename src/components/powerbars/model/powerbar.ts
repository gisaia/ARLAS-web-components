export class PowerBar {
  public term: string;
  public count: number;
  public progression: number;
  public isSelected = false;
  public classSuffix = 'neutral-state';

  constructor(term: string, count: number) {
    this.term = term;
    this.count = count;
  }
}
