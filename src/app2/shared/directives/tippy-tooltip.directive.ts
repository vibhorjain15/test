import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import tippy, { Content, Instance, Props } from 'tippy.js';

@Directive({
  selector: '[tippyTooltip]',
  exportAs: 'tippy-tooltip',
})
export class TippyTooltipDirective
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() tippyTooltip: Content;
  @Input() tippyTooltipOptions: Partial<Props>;
  @Input() placement: any;

  private instance: Instance<Props> = null;

  constructor(private readonly el: ElementRef) {}

  ngAfterViewInit(): void {
    this.instance = tippy(this.el.nativeElement as Element, {});
    this.updateProps({
      ...(this.tippyTooltipOptions ?? {}),
      content: this.tippyTooltip,
      placement: this.placement,
      allowHTML: true,
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    let props: Partial<Props> = {
      ...(this.tippyTooltipOptions ?? {}),
      content: this.tippyTooltip,
      placement: this.placement,
      allowHTML: true,
    };

    if (changes.tippyTooltipOptions) {
      props = {
        ...(changes.tippyTooltipOptions.currentValue ?? {}),
        content: this.tippyTooltip,
        placement: this.placement,
        allowHTML: true,
      };
    }

    if (changes.tippyTooltip) {
      props.content = changes.tippyTooltip.currentValue;
    }

    this.updateProps(props);
  }

  ngOnDestroy(): void {
    this.instance?.destroy();
    this.instance = null;
  }

  private updateProps(props: Partial<Props>): void {
    if (
      this.instance &&
      JSON.stringify(props) !== JSON.stringify(this.instance.props)
    ) {
      this.instance.setProps(this.normalizeOptions(props));
      if (
        props.content === null ||
        props.content === undefined ||
        (typeof props.content === 'string' && props.content.trim() === '')
      ) {
        this.instance.disable(); // disable tooltip if content is empty.
      } else {
        this.instance.enable(); // otherwise, enable it.
      }
    }
  }

  private normalizeOptions(props: Partial<Props>): Partial<Props> {
    return {
      ...(props || {}),
      duration: props?.duration ?? [50, 50],
    };
  }
}
