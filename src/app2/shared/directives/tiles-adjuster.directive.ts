import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[tiles-adjuster1]',
})
export class TilesAdjusterDirective implements OnInit {
  @Input() tileSelector: string;
  @Input() minTileWidth: number;
  @Input() useMaxTileWidth: string;
  averageTileWidth: number;
  tiles: Array<any> = new Array<any>();

  constructor(
    private readonly elementRef: ElementRef) { }

  ngOnInit(): void {
    //this.setAverageTileWidth();
  }

  ngAfterViewInit(): void {
    this.setAverageTileWidth();
    this.adjustTiles();
  }

  setAverageTileWidth() {
    const widthList: number[] = new Array<number>();

    this.elementRef.nativeElement.children.forEach(element => {
      if (element.localName === this.tileSelector) {
        this.tiles.push(element);
        widthList.push(element.offsetWidth);
      }
    });

    if (this.minTileWidth) {
      widthList.push(this.minTileWidth);
    }

    if (JSON.parse(this.useMaxTileWidth)) {
      this.averageTileWidth = Math.max(...widthList);
    } else {
      const totalWidth = widthList.reduce(((res: any, width: any) => res + width), 0);
      this.averageTileWidth = totalWidth / this.tiles.length;
    }
  }

  adjustTiles() {
    const marginRight = 10;
    const containerWidth = this.elementRef.nativeElement.offsetWidth;
    let tileCountPerRow = Math.floor(containerWidth / this.averageTileWidth);

    /*
        For example: averageTileWidth = 200px & containerWidth = 1020px
        => tileCountPerRow = 5
        But we also need (tileCountPerRow - 1) * marginRight for space between tiles
        in the above example we need 40px which is greater thn 20px residual width (containerWidth - averageTileWidth * tileCountPerRow)

        In cases like these we need to recalculate tileCountPerRow based on it's previous prediction
    */
    if (containerWidth < ((this.averageTileWidth * tileCountPerRow) + ((tileCountPerRow - 1) * marginRight))) {
      tileCountPerRow = Math.floor((containerWidth - ((tileCountPerRow - 1) * marginRight)) / this.averageTileWidth);
    }

    // Previous count was excluding margin right, hence recalculating

    if (isNaN(tileCountPerRow)) { return; }
    // PENDING
    /*
        For example, there are 3 tiles per row then width woulc become
        calc(33.333% - 6.66px); 3 tiles & last tile won't have margin => (2 * 10)/3
    */
    // tiles.width('calc(' + percentageWidth + '% - ' + (((tileCountPerRow - 1) * marginRight) / tileCountPerRow) + 'px)').css('margin-right', marginRight);

    // //if tileCountPerRow = 4 => tiles.filter(:nth-child(4n))
    // tiles.filter(':nth-child(' + tileCountPerRow + 'n)').css('margin-right', 0);
    // tiles.filter('.clear-both').removeClass('clear-both');

    // //if tileCountPerRow = 4 => tiles.filter(:nth-child(4n + 1))
    // tiles.filter(':nth-child(' + tileCountPerRow + 'n + 1)').addClass('clear-both');
  }
}
