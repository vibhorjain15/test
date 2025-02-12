import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'searchHighlight' })
export class SearchHighLightPipe implements PipeTransform {
  transform(
    value: any,
    args: any,
    highlightBackground: boolean = false,
    highlight: boolean = true
  ): string {
    if (!args) {
      return value;
    }
    args = args.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string, user can search with brackets also so consider them as part of the string
    const re = new RegExp(args, 'gi');
    const match = value.match(re);

    if (!match) {
      return value;
    }
    const customClass = highlight
      ? highlightBackground
        ? 'highlighted-search-result'
        : 'highlight'
      : '';
    const result = value.replace(
      re,
      `<span class=${customClass}>` + match[0] + '</span>'
    );
    return result;
  }
}
