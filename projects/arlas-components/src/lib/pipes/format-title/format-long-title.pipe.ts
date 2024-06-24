import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: true,
  name: 'formatLongTitle'
})
export class FormatLongTitlePipe implements PipeTransform {

  public transform(value: string, maxLength: number): unknown {
    if(!value){
      return  '';
    }

    if(value.trim().length <= maxLength){
      return  value;
    }

    return `${value.substring(0, maxLength - 3)}...`;
  }

}
