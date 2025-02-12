import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'document-bread-crumbs',
  templateUrl: './document-bread-crumbs.component.html',
  styleUrls: ['./document-bread-crumbs.component.css'],
})
export class DocumentBreadCrumbsComponent implements OnChanges {
  @Input() selectionPath;

  @ViewChild('breadcrumb', { read: ElementRef, static: true })
  breadcrumb: ElementRef<HTMLDivElement>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('selectionPath')) {
      setTimeout(() => {
        this.detectBreadcrumbOverflow();
      });
    }
  }

  private detectBreadcrumbOverflow(): void {
    const el = this.breadcrumb.nativeElement;
    if (el.scrollWidth > el.offsetWidth) {
      el.classList.toggle('breadcrumb--overflow', true);
      el.style.setProperty(
        '--positionFromLeft',
        `${el.scrollWidth - el.clientWidth - 1}px`
      );
      el.scrollBy({ left: el.scrollWidth, behavior: 'smooth' });
      return;
    }

    el.classList.toggle('breadcrumb--overflow', false);
  }
}
