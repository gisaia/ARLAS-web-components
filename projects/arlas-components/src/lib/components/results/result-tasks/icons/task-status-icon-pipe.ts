import { Pipe, PipeTransform } from '@angular/core';
import { TaskStatus } from '../../utils/aias-process';

@Pipe({
  name: 'taskStatusIcon',
})
export class TaskStatusIconPipe implements PipeTransform {

  public transform(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.accepted:
        return 'play_for_work';
      case TaskStatus.running:
        return 'progress_activity';
      case TaskStatus.successful:
        return 'check';
      case TaskStatus.failed:
        return 'error';
      case TaskStatus.dismissed:
        return 'cancel';
      default:
        return 'question_mark';
    };
  }
}
