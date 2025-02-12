import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'Sentencize',
})
export class SentencizePipe implements PipeTransform {
  transform(value: string,  ...args: any[]): string {
    return (value || '').split(/(?=[A-Z])/).join(' ')
  }
}
