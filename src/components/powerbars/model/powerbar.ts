import { SimpleNode } from 'arlas-d3';

export class PowerBar {
  /**
   * @description Powerbar term.
   */
  public term: string;
  /**
   * @description Powerbar parent node term.
   */
  public parentTerm: string;
  /**
   * @description Term's occurence.
   */
  public count: number;
  /**
   * @description Powerbar progression.
   */
  public progression: number;
  /**
   * @description Whether the powerbar is selected.
   */
  public isSelected = false;

  /**
   * @description Path from the powerbar to the parent nodes
   */
  public path: Array<SimpleNode>;
  /**
   * @description class name to apply to the powerbar : `neutral-state`, `selected-bar` or `unselected-bar`.
   */
  public classSuffix = 'neutral-state';
  /**
   * @description color of the powerbar obtained from the powerbar term.
   */
  public color: string;

  constructor(term: string, parentTerm: string, count: number) {
    this.term = term;
    this.parentTerm = parentTerm;
    this.count = count;
  }
}
