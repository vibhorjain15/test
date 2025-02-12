import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'due-diligence-list-card',
  templateUrl: './due-diligence-list-card.component.html',
  styleUrls: ['./due-diligence-list-card.component.css'],
})
export class DueDiligenceListComponent implements OnInit {
  @Input() cardData;
  @Input() isScore: boolean = false;
  @Input() selectedData;
  @Input() ratingScales;
  @Input() naValue;
  @Input() ratingScheme;

  @Output() onSelectData = new EventEmitter<any[]>();
  selectedCard = new Map();

  ngOnInit() {
    if (this.selectedData) {
      this.selectedData.map((id) => this.selectedCard.set(id, id));
    }
  }

  handleOnClick(id) {
    if (this.selectedCard.has(id)) {
      this.selectedCard.delete(id);
    } else {
      this.selectedCard.set(id, id);
    }
    this.onSelectData.emit([...this.selectedCard.values()]);
  }
}
