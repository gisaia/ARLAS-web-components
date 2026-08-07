import { DatePipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { AvailableProcess, Task } from '../utils/aias-process';
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
    DatePipe
],
  templateUrl: './result-tasks.component.html',
  styleUrl: './result-tasks.component.scss',
})
export class ResultTasksComponent {
  public tasks = input.required<Task[]>();

  /** List of processes to not display in the Task summary */
  public ignoredProcesses = input<Set<AvailableProcess>>(new Set());

  public visibleTasks = computed(() => this.tasks()
    .filter(t => !this.ignoredProcesses().has(t.processID))
    // Most recent should be first
    .sort((a, b) => b.created - a.created)
  );

  public latestTask = computed(() => this.visibleTasks().at(0));

  public showTaskTable = signal(false);

  public columnsToDisplay = ['type', 'status', 'created', 'finished'];

  public toggleTaskTable() {
    this.showTaskTable.set(!this.showTaskTable());
  }
}
