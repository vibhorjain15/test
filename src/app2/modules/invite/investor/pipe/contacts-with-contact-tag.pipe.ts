import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'contactsWithContactTag',
})
export class ContactsWithContactTag implements PipeTransform {
  transform(items: any[], tagId: string): any[] {
    if (!tagId) {
      return items;
    } else {
      const filtered = [];
      items.forEach((item) => {
        if (item.tag_ids.indexOf(tagId) > -1) {
          filtered.push(item);
        }
      });
      return filtered;
    }
  }
}
