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

import { inject, Pipe, PipeTransform } from '@angular/core';
import { TaskSettingsService } from '../../utils/aias-process';

@Pipe({
  name: 'processIcon',
})
export class ProcessIconPipe implements PipeTransform {
  private readonly taskSettingsService = inject(TaskSettingsService);

  public transform(processID: string, service: string): string {
    // Check processes defined in the dashboard
    const settings = this.taskSettingsService.getServiceTaskSettings(service);
    if (settings?.processIcons?.[processID]) {
      return settings.processIcons[processID];
    }

    // If not found, then check the pre-configured AIAS processes
    switch (processID) {
      case 'ingest':
        return 'add_photo_alternate';
      case 'directory_ingest':
        return 'create_new_folder';
      case 'enrich':
        return 'auto_awesome_motion';
      case 'download':
        return 'download';
      case 'dc3build':
        return 'deployed_code';
    }

    // Return unknown icon
    return 'question_mark';
  }
}
