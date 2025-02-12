import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'limitTo',
})
export class LimitToPipe implements PipeTransform {
  transform(value: any[], limit: number, ...args: any[]): any[] {
    if (value.length > limit) {
      return value.slice(0, limit);
    } else {
      return value;
    }
  }
}
