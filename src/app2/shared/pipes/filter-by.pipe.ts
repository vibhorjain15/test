import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterBy',
})
export class FilterByPipe implements PipeTransform {
  transform(originalArray: any[], filterBy: any): any[] {
    let key = Object.keys(filterBy)[0];
    let value = filterBy[key] ? filterBy[key].toLowerCase() : '';
    return value
      ? originalArray?.filter((item) => item[key].toLowerCase().includes(value))
      : originalArray;
  }
}
