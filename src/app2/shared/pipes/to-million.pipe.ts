import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'toMillion' })
export class toMillionPipe implements PipeTransform {
  transform(input: any, minimumFractionDigits = 2): string {
    if (input > 1000000000) {
      return '$' + this.convertToBillion(input,minimumFractionDigits) + 'BN';
    } else if (input > 1000000) {
      return '$' + this.convertToMillion(input,minimumFractionDigits) + 'MM';
    } else {
      return input;
    }
  }

  convertToMillion(number, minimumFractionDigits = 2) {
    number = parseInt(number) / 1000000;
    number = Math.round(number * 100) / 100;
    number.toLocaleString('en', {
      minimumFractionDigits,
    });
    return number;
  }

  convertToBillion(number, minimumFractionDigits) {
    number = parseInt(number) / 1000000000;
    number = Math.round(number * 100) / 100;
    number.toLocaleString('en', {
      minimumFractionDigits,
    });
    return number;
  }
}
