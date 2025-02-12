import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  pure: false
})
export class FilterPipe implements PipeTransform {
  transform(
    originalArray: any[],
    filterString: string,
    filteredListMeta: any = {}
  ): any[] {
    const filteredItems = filterString.length
      ? originalArray.filter((item) =>
          JSON.stringify(item)
            .toLowerCase()
            .includes(filterString.toLowerCase())
        )
      : originalArray;
    filteredListMeta.count = filteredItems.length;
    filteredListMeta.items = filteredItems;
    return filteredItems;
  }
}
