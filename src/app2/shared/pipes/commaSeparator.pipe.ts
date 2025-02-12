import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'commaSeparator' })
export class CommaSeparatorPipe implements PipeTransform {
  transform(value: string): string {
    if (!isNaN(Number(value))) {
      return Number(value).toLocaleString('en-US');
    } else {
      return value;
    }
  }
}
