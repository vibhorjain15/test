import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sanitizeClass' })
export class SanitizeClassPipe implements PipeTransform {
  transform(html) {
    return html?.replace(/dv-sidebar-panel/g, '');
  }
}
