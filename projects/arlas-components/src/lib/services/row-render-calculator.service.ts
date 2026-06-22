import { Injectable } from '@angular/core';
import {marker} from '@colsen1991/ngx-translate-extract-marker';

interface BadgeLayoutResult {
  maxRow: number;
  maxItemPerLine: number;
}

@Injectable({
  providedIn: 'root'
})
export class RowRenderCalculatorService {
  /** Cached calculation result to avoid recalculating with same parameters */
  private results: null | BadgeLayoutResult = null;

  /**
   * Returns cached calculation results or computes them if not already calculated.
   * @param containerWidth - Width of the container in pixels
   * @param maxRow - Maximum number of rows allowed
   * @param itemCount - Total number of items to display
   * @param defaultItemWidth - Default minimum width of an item
   * @returns BadgeLayoutResult containing maxRow, maxItemWidth, and maxItemPerLine
   */
  public calculateRender(containerWidth: number, maxRow: number, itemCount: number, defaultItemWidth: number){
    if(!this.results){
      this.results = this.calculate(containerWidth,maxRow, itemCount, defaultItemWidth);
    }

    return this.results;
  }

  /**
   * Clears the cached calculation results to force recalculation on next call.
   */
  public resetCalculation(){
    this.results = null;
  }

  /**
   * Calculates the optimal layout for badge display based on container and item constraints.
   * @param containerWidth - Width of the container in pixels
   * @param maxRow - Maximum number of rows allowed
   * @param itemCount - Total number of items to display
   * @param defaultItemWidth - Default minimum width of an item
   * @returns BadgeLayoutResult with calculated dimensions
   */
  private calculate(containerWidth: number, maxRow: number, itemCount: number,
                   defaultItemWidth: number): BadgeLayoutResult {
    const resolvedMaxRow = this.getMaxRow(maxRow, itemCount, containerWidth, defaultItemWidth);
    const maxItemPerLine = this.computeMaxItemPerLine(itemCount, resolvedMaxRow);

    return {
      maxRow: resolvedMaxRow,
      maxItemPerLine,
    };
  }

  /**
   * Calculates the maximum number of items that can fit on a single line
   * by distributing total items across available rows.
   * @param itemCount - Total number of items
   * @param maxRow - Maximum number of rows
   * @returns Maximum items per line, rounded up
   */
  private computeMaxItemPerLine(itemCount: number, maxRow: number): number {
    if (maxRow <= 0) {
      throw new Error(marker('maxRow must be greater than 0'));
    }
    return Math.ceil(itemCount / maxRow);
  }

  /**
   * Determines the optimal number of rows based on container and item dimensions.
   * Calculates how many rows are needed to fit all items based on container width,
   * then returns the minimum of that and the maximum allowed rows.
   * @param maxRow - Maximum allowed rows
   * @param itemCount - Total number of items
   * @param containerWidth - Container width in pixels
   * @param defaultItemWidth - Default item width in pixels
   * @returns Optimal number of rows
   */
  public getMaxRow(maxRow: number, itemCount: number, containerWidth: number, defaultItemWidth: number) {
    const itemsPerLineCapacity = Math.floor(containerWidth / defaultItemWidth);
    const rowsNeeded = Math.ceil(itemCount / itemsPerLineCapacity);
    return Math.min(maxRow, rowsNeeded);
  }
}
