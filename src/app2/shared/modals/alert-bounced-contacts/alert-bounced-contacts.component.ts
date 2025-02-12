import { Component, Input, OnInit } from '@angular/core';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';

@Component({
  selector: 'app-alert-bounced-contacts',
  templateUrl: './alert-bounced-contacts.component.html',
  styles:[`.margin-top{
    margin-top:20px !important;
  }`]
})
export class AlertBouncedContactsComponent implements OnInit {
  @Input() entitiesList: any;
  @Input() contactsList: any;
  @Input() success: any;

  bouncedEntities = [];
  bouncedEntitiesList = [];
  allEntities = [];
  estimatedEntitiesRecipients = [];
  showBouncedEntitiesList = false;
  entityType: any;
  bouncedContacts = [];
  bouncedContactsList = [];
  allContacts = [];
  estimatedRecipients = [];
  showBouncedContactsList = false;

  constructor(private customModalService: CustomModalService) {}

  ngOnInit(): void {
    this.initialize();
  }

  initialize() {
    this.entityType = this.entitiesList.entity_type;

    if (this.entitiesList?.all && this.entitiesList?.all?.length) {
      (this.entitiesList.all as Array<any>).forEach((entity) => {
        if (!this.allEntities.filter((x) => x.id === entity.id).length) {
          this.allEntities.push(entity.id);
        }
      });
    }

    if (this.entitiesList?.bounced && this.entitiesList?.bounced?.length) {
      (this.entitiesList?.bounced as Array<any>).forEach((entity) => {
        if (!this.bouncedEntities.filter((x) => x.id === entity.id).length) {
          this.bouncedEntities.push(entity.id);
          this.bouncedEntitiesList.push(entity);
        }
      });
    }

    (this.contactsList.all as Array<any>).forEach((entity) => {
      if (!this.allContacts.filter((x) => x.id === entity.id).length) {
        this.allContacts.push(entity.id);
      }
    });

    (this.contactsList.bounced as Array<any>).forEach((contact) => {
      if (!this.bouncedContacts.filter((x) => x.id === contact.id).length) {
        this.bouncedContacts.push(contact.id);
        this.bouncedContactsList.push(contact);
      }
    });
  }

  cancel() {
    this.close('canceled');
  }

  close(reason: string) {
    this.success(reason);
    this.customModalService.close();
  }

  userClickedOk() {
    this.close('closed');
  }

  learnMore() {
    this.showBouncedContactsList = true;
  }

  learnMoreEntities() {
    this.showBouncedEntitiesList = true;
  }

  numberWithCommas(number: string) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
