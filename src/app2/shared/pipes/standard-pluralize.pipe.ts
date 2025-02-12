import { Pipe, PipeTransform } from '@angular/core';
import Pluralize from 'pluralize';
@Pipe({
  name: 'standardPluralize',
})
export class StandardPluralizePipe implements PipeTransform {
  constructor() {}

  transform(text: string): any {
    return text ? Pluralize(text) : '';
  }
}
