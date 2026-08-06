import { Pipe, PipeTransform } from '@angular/core';
import { AvailableProcess } from '../../utils/aias-process';

@Pipe({
  name: 'processIcon',
})
export class ProcessIconPipe implements PipeTransform {

  public transform(processID: AvailableProcess): unknown {
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
      default:
        return 'question_mark';
    }
  }
}
