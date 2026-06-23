/*
 * Licensed to Gisaïa under one or more contributor
 * license agreements. See the NOTICE.txt file distributed with
 * this work for additional information regarding copyright
 * ownership. Gisaïa licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {Component, computed, ElementRef, inject, input, viewChild} from '@angular/core';
import {HybridField} from '../model/hybridField';
import {Item} from '../model/item';
import {MetaBadge, ResultMetaBadgeComponent} from '../result-meta-badge/result-meta-badge.component';
import {RowRenderCalculatorService} from '../../../services/row-render-calculator.service';

@Component({
  selector: 'arlas-result-meta-badges',
  imports: [
    ResultMetaBadgeComponent
  ],
  templateUrl: './result-meta-badges.component.html',
  styleUrl: './result-meta-badges.component.scss'
})
export class ResultMetaBadgesComponent {
  /** Item containing the data to display */
  public item = input<Item>(undefined);
  /** Hybrid fields to display as badges */
  public fields = input<HybridField[]>([]);
  /** Character used to separate items */
  public spacingChar = input<string>('•');
  public emptyValue = input<string>('-');
  /** Reference to the HTML container for badges */
  public contentContainer = viewChild<ElementRef<HTMLElement>>('container');
  /** Number of items per line */
  protected maxItemPerLine = 3;
  /** Maximum number of lines for display */
  private MaxRow = 3;
  /** Container width in pixels */
  public containerWidth = 364;
  /** Default minimum width of an item. This value is totally arbitrary and asumle that
   * the best case is when we can add 3 item per ligne
   * */
  public  itemDefaultMinWidth = 100;
  /** Separator used in tooltip (e.g., fieldName : value) */
  public readonly TOOLTIP_VALUE_SPACER = ':';
  private readonly rowRenderCalculatorService = inject(RowRenderCalculatorService);

  /**
   * Computes and structures badges into rows based on available space.
   * Automatically recalculates when item or fields change.
   * Uses guard clauses to validate data before processing.
   */
  public metaBadgesRows = computed<MetaBadge[][]>(() => {
    // Guard: Validate required inputs
    if (!this.isValidInput()) {
      return [];
    }

    const badges = this.createBadges();
    if (badges.length === 0) {
      return [];
    }

    // Update container width (DOM access is only risky operation)
    this.updateContainerWidth();

    // Calculate layout
    this.calculateLayout(badges.length);

    return this.createRows(badges);
  });

  /**
   * Validates that required inputs are available.
   */
  private isValidInput(): boolean {
    return !!this.item()?.itemData && !!this.fields() && this.fields().length > 0;
  }

  /**
   * Updates container width from DOM element. Only try-catch here for DOM access.
   */
  private updateContainerWidth(): void {
    try {
      const container = this.contentContainer();
      if (container?.nativeElement) {
        const width = container.nativeElement.getBoundingClientRect().width;
        if (width && width > 0) {
          this.containerWidth = width;
        }
      }
    } catch (e) {
      console.warn('ResultMetaBadgesComponent: Failed to get container width', e);
      // Use default containerWidth already set
    }
  }

  /**
   * Calculates layout dimensions, with fallback to defaults if calculation fails.
   */
  private calculateLayout(badgeCount: number): void {
    try {
      const {maxRow, maxItemPerLine} = this.rowRenderCalculatorService
        .calculateRender(this.containerWidth, this.MaxRow, badgeCount, this.itemDefaultMinWidth);

      this.MaxRow = maxRow;
      this.maxItemPerLine = maxItemPerLine;
    } catch (e) {
      console.error('ResultMetaBadgesComponent: Layout calculation failed, using defaults', e);
      // Fallback to safe defaults
      this.MaxRow = Math.min(3, Math.ceil(badgeCount / 3));
      this.maxItemPerLine = 3;
    }
  }

  /**
   * Create badges based on the provided fields and item data.
   * Uses guard clauses to validate data, only wraps DOM/service operations in try-catch.
   * @returns An array of MetaBadge objects representing the badges to display
   */
  public createBadges(): MetaBadge[] {
    // Guard: Validate prerequisites
    if (!this.item()?.itemData || !this.fields()?.length) {
      return [];
    }

    return this.fields().map<MetaBadge>(field => {
      const value = this.item().itemData.get(field.fieldName) ?? this.emptyValue();
      const hasValue = value !== this.emptyValue();
      return {
        value,
        icon: field?.icon || '',
        unit: field?.dataType || '',
        tooltip: `${field.prettyName} ${this.TOOLTIP_VALUE_SPACER} ${value}
        ${ hasValue ? (field?.dataType || '') : ''}`
      };
    });
  }

  /**
   * Creates rows of badges by distributing them according to the maximum
   * number of items per line and maximum number of lines.
   * Uses guard clauses for validation.
   * @param metaBages - Array of badges to organize
   * @returns Two-dimensional array of badges organized into rows
   */
  public createRows(metaBages: MetaBadge[]): MetaBadge[][] {
    // Guard: Validate inputs
    if (!metaBages?.length) {
      return [];
    }

    if (this.maxItemPerLine <= 0 || this.MaxRow <= 0) {
      console.warn(`ResultMetaBadgesComponent.createRows: Invalid dimensions. maxItemPerLine=${this.maxItemPerLine}, MaxRow=${this.MaxRow}`);
      return [metaBages]; // Fallback: single row
    }

    const result: MetaBadge[][] = [];
    let slice = this.maxItemPerLine;

    for (let i = 0; i < this.MaxRow; i++) {
      const start = slice - this.maxItemPerLine;
      const end = slice;
      const row = metaBages.slice(start, end);

      if (row.length > 0) {
        result.push(row);
      }

      slice += this.maxItemPerLine;

      // Prevent processing beyond array bounds
      if (start >= metaBages.length) {
        break;
      }
    }

    return result.length > 0 ? result : [metaBages];
  }
}
