import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'entitiesWithContactTag',
  pure: false,
})
export class EntitiesWithContactTag implements PipeTransform {
  transform(items: any[], tagId: string, filteredListMeta: any = {}): any[] {
    if (!tagId) {
      items.forEach((item, i: number) => {
        i = 0;
        let total_recipients_count = 0;
        if (item.notification_contacts?.length > 0) {
          while (i < item.notification_contacts?.length) {
            if (!item.notification_contacts[i].is_removed) {
              total_recipients_count += 1;
            }
            i++;
          }
        }
        item.total_recipients_count = total_recipients_count;
      });
      filteredListMeta.count = items.length;
      filteredListMeta.items = items;
      return items;
    } else {
      const filtered = [];
      items.forEach((item, i: number) => {
        if (item.notification_contacts?.length) {
          i = 0;
          let has_contact_tag = false;
          let total_recipients_count = 0;
          if (item.notification_contacts?.length > 0) {
            while (i < item.notification_contacts?.length) {
              if (item.notification_contacts[i].tag_ids.indexOf(tagId) > -1) {
                if (!item.notification_contacts[i].is_removed) {
                  total_recipients_count += 1;
                }
                has_contact_tag = true;
              }
              i++;
            }
          }
          if (has_contact_tag) {
            item.total_recipients_count = total_recipients_count;
            filtered.push(item);
          }
        }
      });
      filteredListMeta.count = filtered.length;
      filteredListMeta.items = filtered;
      return filtered;
    }
  }
}
