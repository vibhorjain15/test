import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBy',
})
export class OrderByPipe implements PipeTransform {
  transform(originalArray: any[], orderKey: string): any[] {
    return originalArray.sort((a, b) => {
      const nameA = typeof a[orderKey] == 'string'? a[orderKey].toLowerCase(): a[orderKey];
      const nameB = typeof b[orderKey] == 'string'? b[orderKey].toLowerCase(): b[orderKey];
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
  }
}
