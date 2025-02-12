import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cleanHtml' })
export class CleanHtmlPipe implements PipeTransform {
  transform(html) {
    return html?.replace(/&nbsp;/g, '')?.replace(/> </g, '><');
  }
}
