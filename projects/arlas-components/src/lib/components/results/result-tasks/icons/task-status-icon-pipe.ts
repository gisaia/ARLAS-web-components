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
