import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeUnderscores',
})
export class RemoveUnderscoresPipe implements PipeTransform {
  transform(value: string): string {
    if (value) {
      const str = value.toString().replace(/_/g, ' ');
      return str;
    }
    return value;
  }
}
