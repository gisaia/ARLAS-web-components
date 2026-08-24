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

import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { DeltaTimePipe } from '../../../pipes/delta-time.pipe';
import { Task, TaskSettingsService } from '../utils/aias-process';
import { ProcessIconPipe } from './icons/process-icon-pipe';

@Component({
  selector: 'arlas-result-tasks',
  imports: [
    MatIcon,
    ProcessIconPipe,
    TranslatePipe,
    MatButtonModule,
    MatTooltip,
    MatChipListbox,
    MatChipOption,
    MatTableModule,
    DatePipe,
    DeltaTimePipe
],
  templateUrl: './result-tasks.component.html',
  styleUrl: './result-tasks.component.scss',
})
export class ResultTasksComponent {
  public tasks = input.required<Task[]>();

  public service = input.required<string>();

  /** List of processes to not display in the Task summary */
  public ignoredProcesses = computed(() => {
    const settings = this.taskService.getServiceTaskSettings(this.service());
    return new Set(settings?.ignoredProcess ?? []);
  });

  public visibleTasks = computed(() => this.tasks()
    .filter(t => !this.ignoredProcesses().has(t.processID))
    // Most recent should be first
    .sort((a, b) => b.created - a.created)
    .filter((_, idx) => this.displayAllTasks() ? true : idx === 0)
  );

  public displayAllTasks = signal(false);

  public columnsToDisplay = ['process', 'status', 'created', 'duration'];

  private readonly taskService = inject(TaskSettingsService);

  public toggleTaskDisplay() {
    this.displayAllTasks.set(!this.displayAllTasks());
  }
}
