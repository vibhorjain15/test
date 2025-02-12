import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'searchHighlight' })
export class SearchHighLightPipe implements PipeTransform {
  transform(value: any, args: any): string {
    if (!args) {
      return value;
    }
    const re = new RegExp(args, 'gi');
    const match = `${value}`.split('<separator>')[0].match(re);

    if (!match) {
      return value;
    }

    const htmlData = `${value}`.split('<separator>')[1];

    let result = `${value}`
      .split('<separator>')[0]
      .replace(re, (str) => '<span class="highlight">' + str + '</span>');
    if (htmlData) {
      result += `<separator> ${htmlData}`;
    }
    return result;
  }
}
