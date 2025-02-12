import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  Renderer2,
  ViewContainerRef,
  ComponentFactoryResolver,
} from '@angular/core';
import { CategoriesListComponent } from '../components';

@Directive({
  selector: '[showSide]',
})
export class PushBarPanelDirective implements OnInit {
  @Input() panelNumber = 1;
  @Input() top = '80px';
  @Input() title;
  @Input() categoryData = [];
  @Input() loading = false;
  @Input() activeRow = null;
  id = Math.floor(100000 + Math.random() * 900000);
  currentData: any;
  factory;
  constructor(
    private _elementRef: ElementRef,
    // private sanitizer: Sanitizer,
    private renderer: Renderer2,
    private factoryResolver: ComponentFactoryResolver,
    public viewContainerRef: ViewContainerRef
  ) {
    this.renderer.setAttribute(
      this._elementRef.nativeElement,
      'class',
      'sidenav'
    );
  }

  ngOnInit(): void {
    this._elementRef.nativeElement.innerHTML = this.title;
    this.factory = this.factoryResolver.resolveComponentFactory(
      CategoriesListComponent
    );
    this.viewContainerRef.clear();
    this.renderer.setAttribute(
      this._elementRef.nativeElement,
      'id',
      `${this.id}`
    );
    this._elementRef.nativeElement.style.top = this.top;
    if (this.panelNumber > 1) {
      this._elementRef.nativeElement.style.left = `${
        30 * (this.panelNumber - 1) + 1
      }px`;
      this._elementRef.nativeElement.style['z-index'] =
        (10 - this.panelNumber) * 100;
    } else this._elementRef.nativeElement.style['z-index'] = 999;
    this.updateCloseStyles();
  }

  // @HostListener('document:click', ['$event'])
  public onClick($event: any) {
    let click = this._elementRef.nativeElement.contains($event.target);
    if ($event.path[0].id == this.id) {
      this.updateOpenStyles();
      this.addPushContainer();
    } else if ($event.path[0].id == 'pushContainer') {
      this.updateCloseStyles();
      this.removePushContainer();
    } else if (!click) {
      this._elementRef.nativeElement.style.width = '30px';
      this.renderer.setAttribute(
        this._elementRef.nativeElement,
        'class',
        'sidenav sidenav-hid'
      );
    }
  }

  updateOpenStyles() {
    this.renderer.setAttribute(
      this._elementRef.nativeElement,
      'class',
      'sidenav'
    );
    this._elementRef.nativeElement.style.width = '33.33%';
    this._elementRef.nativeElement.style.backgroundColor = ' white';
    document.body.style.backgroundColor = 'rgba(0,0,0,0.4) !important';
    this._elementRef.nativeElement.style['writing-mode'] = 'horizontal-tb';
    // this._elementRef.nativeElement.innerHTML = '';
    const componentRef =
      this.viewContainerRef.createComponent<CategoriesListComponent>(
        this.factory
      );
    componentRef.instance.categoryData = this.categoryData;
    // componentRef.instance.title = this.title;
    // this._elementRef.nativeElement.innerHTML = this.sanitizer.sanitize(SecurityContext.HTML,this.sanitizer.bypassSecurityTrustHtml(this.currentData));
    // this.renderer.seto(this._elementRef.nativeElement, 'innerHTML', 'my new content');
    // this._elementRef.nativeElement.innerHTML = this.sanitizer.bypassSecurityTrustHtml(this.currentData);
    // this.sanitizer.sanitize(SecurityContext.HTML,this.currentData)
    // this.sanitizer.sanitize(
    //   SecurityContext.HTML,
    //   this.currentData
    // );
  }

  updateCloseStyles() {
    this._elementRef.nativeElement.style.width = '30px';
    this._elementRef.nativeElement.style.color = ' #126b82';
    this._elementRef.nativeElement.style.display = 'flex';
    this._elementRef.nativeElement.style['justify-content'] = 'center';
    this._elementRef.nativeElement.style.border = '1px solid #126b82';
    this._elementRef.nativeElement.style.height = 'calc(100vh - 50px)';
    this._elementRef.nativeElement.style.backgroundColor = ' #126b820D';
    this._elementRef.nativeElement.style['writing-mode'] = 'vertical-rl';
    // this._elementRef.nativeElement.innerHTML = this.title;
    document.body.style.backgroundColor = 'white';
    this.renderer.setAttribute(
      this._elementRef.nativeElement,
      'class',
      'sidenav sidenav-hide'
    );
  }

  removePushContainer() {
    const pushContainer = document.getElementById(
      'pushContainer'
    ) as HTMLDivElement;
    if (pushContainer) {
      pushContainer.remove();
    }
  }

  addPushContainer() {
    let pushContainer = document.getElementById(
      'pushContainer'
    ) as HTMLDivElement;
    if (!pushContainer) {
      const container = document.createElement('div') as HTMLDivElement;
      container.style.height = '100%';
      container.style.minHeight = '100vh';
      container.style.width = '100%';
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.backgroundColor = 'rgba(0,0,0,.5)';
      container.id = 'pushContainer';
      document.body.appendChild(container);
    }
  }
}
