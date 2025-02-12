import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getFirstLetter',
})
export class GetFirstLetterPipe implements PipeTransform {
  transform(input: string): string {
    if (input?.length) {
      return `${input[0]}`;
    }
    return '';
  }
}
