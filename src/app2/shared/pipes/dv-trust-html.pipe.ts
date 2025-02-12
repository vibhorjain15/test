import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as DOMPurify from 'dompurify';

@Pipe({
  name: 'dvSafeHtml',
})
export class DvSafeHtmlPipe implements PipeTransform {
  constructor(private sanitized: DomSanitizer) {}

  //  sanitizes HTML content to remove potential security risks like js functions
  transform(value: string): SafeHtml {
    let html = value;
    html = DOMPurify.sanitize(value);
    const safeHtml = this.sanitized.bypassSecurityTrustHtml(html);
    return safeHtml;
  }
}
