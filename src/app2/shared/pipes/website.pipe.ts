import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'website',
})
export class WebsitePipe implements PipeTransform {
  transform(input: string): string {
    const httpString = 'http://';
    const httpsString = 'https://';
    const finalUrl =
      input.indexOf(httpString) === 0 || input.indexOf(httpsString) === 0
        ? input
        : httpString + input;
    return finalUrl;
  }
}
