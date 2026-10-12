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

import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { CogPreviewComponent } from '../cog-preview/cog-preview.component';
import { VisualisationInterface } from '../model';


export interface CogVisualisationData {
  visualisation: VisualisationInterface;
  match: 'all' | 'partial' | 'none';
  preview?: string;
  selected?: boolean;
}


@Component({
  selector: 'arlas-cog-modal',
  imports: [
    CogPreviewComponent,
    TranslatePipe,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './cog-modal.component.html',
  styleUrl: './cog-modal.component.scss'
})
export class CogModalComponent {
  private readonly cdr = inject(ChangeDetectorRef);

  public data: { visualisations: CogVisualisationData[]; loading: boolean; } = inject(MAT_DIALOG_DATA);

  /** List of visualisations that the user can select */
  public visualisations = signal<CogVisualisationData[]>([]);
  /** List of visualisations that are matched by none of the selected items */
  public unmatchedVisualisations = signal<CogVisualisationData[]>([]);

  protected readonly DEFAULT_IMAGE = './assets/no-view.png';

  public constructor() {
    this.splitVisualisations();
  }

  public update(visualisations: CogVisualisationData[], loading: boolean) {
    this.data = { visualisations, loading };
    this.splitVisualisations();
    this.cdr.detectChanges();
  }

  /**
   * Split input visualisations between the matched and unmatched ones
   */
  private splitVisualisations() {
    this.visualisations.set(this.data.visualisations.filter(v => v.match !== 'none'));
    this.unmatchedVisualisations.set(this.data.visualisations.filter(v => v.match === 'none'));
  }
}
