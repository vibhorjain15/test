import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-dv-context-menu',
  templateUrl: './dv-context-menu.component.html',
  styleUrls: ['./dv-context-menu.component.css'],
})
export class DvContextMenuComponent {
  @Input() items = [];
  @Input() selector: string = 'span';

  isOpen: boolean = false;
  posX: number;
  posY: number;
  subMenuPosX: number = 226.9;
  event: Event;
  visibleItems = [];

  @Output() itemClick = new EventEmitter();

  @HostListener('document:click')
  documentClick() {
    this.closeMenu();
  }

  @HostListener('document:contextmenu', ['$event'])
  documentRightClick(event: MouseEvent) {
    event.preventDefault();

    if (!((event.target as Element).matches(this.selector) || (event.target as Element).closest(this.selector))) return;

    this.event = event;
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.visibleItems = this.filtered(this.items);
    this.visibleItems.forEach(menuItem => {
      menuItem.visibleSubmenuItems = this.filtered(menuItem.submenuItems);
    });

    if ((height - event.clientY) < 30 * this.visibleItems.length) {
      this.posY = event.pageY - 30 * this.visibleItems.length - 30;
    } else {
      this.posY = event.pageY - 30;
    }

    if ((width - event.clientX) < 233) {
      this.posX = event.pageX - 233;
    } else {
      this.posX = event.pageX;
    }

    if ((width - event.clientX) < 2 * 233) {
      this.subMenuPosX = -202;
    } else {
      this.subMenuPosX = 226.9;
    }

    this.openMenu();
  }

  openMenu() {
    if (this.isOpen) this.isOpen = false;
    this.isOpen = true;
  }

  closeMenu() {
    this.posX = 0;
    this.posY = 0;

    this.items.forEach((menuItem) => {
      menuItem.show = false;
      menuItem.hover = false;
      if (menuItem.submenuItems) {
        menuItem.submenuItems.forEach(subMenuItem => {
          subMenuItem.show = false;
          subMenuItem.hover = false;
        });
      }
    });
    this.isOpen = false;
  }

  itemSelect(subMenu: any) {
    if (subMenu.items) return;

    this.itemClick.emit(subMenu);
    this.closeMenu();
  }

  filtered(items: any) {
    if (!items) return [];

    let event = {
      currentTarget: this.event.target,
      target: this.event.target
    }

    return items.filter(item => item.visible ? item.visible(event) : true);
  }
}
