import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-contact-tags',
  templateUrl: './contact-tags.component.html',
  styleUrls: ['./contact-tags.component.css'],
})
export class ContactTagsComponent implements OnInit {
  contactInfo;
  contactTags;

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.contactInfo = {
      label: 'Contact Type Tags',
      name: 'Contact',
      templateUrl: 'firm/settings/popover_templates/Contact.html',
      desc: 'contact type, eg. Portfolio Management, Operations, Investment Relations',
    };
    this.getContactTypes();
  }

  getContactTypes() {
    this.http
      .get('tags', { params: { type: 'Contact' } })
      .subscribe((response: any) => {
        this.contactTags = response;
        this.sortTags();
      });
  }

  sortTags() {
    this.contactTags.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });
  }
}

