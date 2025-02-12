// This directive will allow you to use the pipe in different ways:

// {{ dateVariable | dvDate }} for default formatting.
// {{ dateVariable | dvDate:['fromNow'] }} for relative time formatting.
// {{ dateVariable | dvDate:['calendarTime'] }} for relative time formatting.
// {{ dateVariable | dvDate:['dvDateTime'] }} for relative time formatting.
// {{ dateVariable | dvDate:['dd-MMM-y'] }} for custom date formatting.
// {{ dateVariable | dvDate:['calendarTime', 'uppercase'] }} lowercase, uppercase, titlecase only apply on calendarTime.
// {{ dateVariable | dvDate:['isLocaleDate']  }} flag for date which does not need conversion to utc and (applicable with all other input below).

import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'dvDate',
})
export class DvDatePipe implements PipeTransform {
  defaultDateFormat: string = 'MMM DD, Y';
  defaultDateTimeFormat: string = 'MMM DD, Y [at] h:mm A';

  transform(value: string, formatOptions?: string[]): string {
    if (!value) {
      return '';
    }

    const flags = {
      isLocaleDate: formatOptions?.includes('isLocaleDate') || false,
      caseOption: formatOptions?.find((option) =>
        ['uppercase', 'lowercase', 'titlecase'].includes(option)
      ),
    };

    // Parse date based on isLocaleDate flag
    const date = flags.isLocaleDate ? moment(value) : moment.utc(value).local();

    // Get formatOption if provided
    const formatOption = formatOptions?.find(
      (option) =>
        !['isLocaleDate', 'uppercase', 'lowercase', 'titlecase'].includes(
          option
        )
    );

    // Check if formatOption is a valid format or a custom behavior option
    const isCustomFormat = (format: string): boolean => {
      const customOptions = ['calendarTime', 'fromNow', 'dvDateTime'];
      return !customOptions.includes(format) && isValidDateFormat(format);
    };

    const isValidDateFormat = (format: string): boolean => {
      try {
        // Attempt to format a valid date with the given format
        const testDate = moment().format(format);

        // If Moment returns 'Invalid date' or the format is unrecognized, return false
        return testDate !== 'Invalid date';
      } catch (e) {
        console.warn(
          `Invalid date format: "${format}". Falling back to default format.`
        );
        return false;
      }
    };

    const applyCase = (text: string): string => {
      switch (flags.caseOption) {
        case 'uppercase':
          return text.toUpperCase();
        case 'lowercase':
          return text.toLowerCase();
        case 'titlecase':
          return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        default:
          return text; // Default behavior is no change to case
      }
    };
    // Apply formatting based on formatOption
    switch (formatOption) {
      case 'calendarTime':
        return date.calendar({
          sameDay: `[${applyCase('Today')} at] h:mm:ss A`,
          nextDay: `[${applyCase('Tomorrow')} at] h:mm:ss A`,
          lastDay: `[${applyCase('Yesterday')} at] h:mm:ss A`,
          nextWeek: 'MMM D [at] h:mm:ss A',
          lastWeek: 'MMM D [at] h:mm:ss A',
          sameElse: 'MMM D [at] h:mm:ss A',
        });
      case 'fromNow':
        return date.fromNow();
      case 'dvDateTime':
        return date.format(this.defaultDateTimeFormat);
      default:
        // Apply the custom format if it's valid, otherwise fall back to the default format
        return formatOption && isCustomFormat(formatOption)
          ? date.format(formatOption)
          : date.format(this.defaultDateFormat);
    }
  }
}

// Summary of Possible Combinations
// Flags:
//  'isLocaleDate'
// Format Options:
//  'fromNow',
//  'calendarTime',
//  'dvDateTime',
//  or any custom format string (like 'dd-MMM-y')
// Case Option:
//   Only applicable with calendarTime formatting.
