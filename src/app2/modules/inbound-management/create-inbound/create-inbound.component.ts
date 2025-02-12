import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-create-inbound',
  templateUrl: './create-inbound.component.html',
  styleUrls: ['./create-inbound.component.css'],
})
export class CreateInboundComponent  {
  @Output() showStepper = new EventEmitter();

  onGetStarted() {
    this.showStepper.emit();
  }
}
