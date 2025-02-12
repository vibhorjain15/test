import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
} from '@angular/core';

@Directive({
  selector: '[appPrintSection]',
})
export class PrintSectionDirective implements OnInit, OnChanges {
  @Input() sectionTemplateUrl;
  @Input() buttonLoader;
  @Input() printOptions;
  @Input() sectionId;
  element;
  options;
  locals;

  constructor(
    private readonly elementRef: ElementRef
  ) {}

  ngOnChanges(changes): void {
    if (changes?.printOptions) {
      // this.locals = changes.printOptions.locals;
      const { locals, ...options } = changes.printOptions;
      this.locals = locals;
      this.options = options;
    }
  }

  ngOnInit(): void {
    this.element = this.elementRef.nativeElement;
    if (this.sectionTemplateUrl && !this.buttonLoader) {
      this.element.setAttribute('button-loader', 'is_printing');
      // element.replaceWith($compile(element)(scope));
      // return;
    }
  }

  printSection(el) {
    // const $body = $('body');
    // $body.addClass('print-initiated');
    // el.addClass('print-section');
    // $window.print();
    // return $timeout(() => $body.removeClass('print-initiated'));
    const body = document.getElementsByTagName('BODY')[0];
    body.classList.add('print-initiated');
    el.classList.add('print-section');
    window.print();
    setTimeout(() => body.classList.remove('print-initiated'));
  }

  waitForRenderAndPrint(printScope, el) {
    /* if (printScope.$$phase || $http.pendingRequests.length) {
      return $timeout(() => waitForRenderAndPrint(printScope, el));
    } else {
      return printSection(el).then(function () {
        $(el).remove();
        printScope.$destroy();
        return (scope.is_printing = false);
      });
    } */
  }

  appendAndPrintSection(templateUrl) {
    // const template = $templateCache.get(templateUrl);
    // const printScope = angular.extend(scope.$new(), locals);
    /* const el = $compile(template)(printScope);
    el.addClass('visible-print');
    $('body').append(el);
    return $timeout(() => waitForRenderAndPrint(printScope, el)); */
  }
}
