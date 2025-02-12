import { ContextPlugin } from 'ckeditor5';

import * as moment from 'moment';

export class DVUtils extends ContextPlugin {
  static get pluginName() {
    return 'DVUtils' as const;
  }

  getLocalDateTimeGeneric(date: string | Date): Date | null {
    if (!date) {
      return null;
    }

    return moment(date).add(moment(date).utcOffset(), 'minutes').toDate();
  }
}
