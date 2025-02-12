import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'interpolate',
})
export class InterpolatePipe implements PipeTransform {
  transform(value: string, ...args: string[]): string {
    let strCpy = value;
    let match = strCpy.match(/{{/g) ? strCpy.match(/{{/g).length : 0;
    if (match) {
      if (args.length !== match) {
        return 'Invalid parameters';
      } else {
        for (let i = 0; i < match; i++) {
          strCpy = this.getString(
            strCpy,
            strCpy.indexOf('{{'),
            strCpy.indexOf('}}'),
            args[i]
          );
        }
        return strCpy;
      }
    } else {
      return value;
    }
  }

  getString(strCpy: string, start: number, end: number, val: string): string {
    return strCpy.slice(0, start) + val + strCpy.slice(end + 2, strCpy.length);
  }
}
