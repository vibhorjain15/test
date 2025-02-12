import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'absoluteNumber',
})
export class AbsoluteNumberPipe implements PipeTransform {
  transform(value: number): number {
    if (value) {
      return Math.abs(value)
    }
    return value;
  }
}
