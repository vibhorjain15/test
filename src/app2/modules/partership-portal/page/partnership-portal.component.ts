import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PartnershipService } from '../service/partnership.service';
import { PartnershipTypes, PartnersTypes } from '../service/partnership.types';

@Component({
  selector: 'partnership-portal',
  templateUrl: './partnership-portal.component.html',
  styleUrls: ['./partnership-portal.component.css'],
})
export class PartnershipPortalComponent implements OnInit {
  leftMenu: any = [];
  partners: PartnersTypes[];
  partnerLists;
  lastSelectedIndex = 0;
  typePartnerMap = {};
  loader = true;
  constructor(
    private partnershipService: PartnershipService,
  ) {}
  ngOnInit(): void {
    forkJoin([
      this.partnershipService.getPartnershipTypes(),
      this.partnershipService.getPartners(),
    ]).subscribe((response) => {
      this.loader = false;
      let menu: PartnershipTypes[] = response[0] as PartnershipTypes[];
      let partners: Array<PartnersTypes & any> = response[1] as PartnersTypes[];
      this.leftMenu = menu.map((val, index) => {
        this.typePartnerMap[val.id] = [];
        return {
          ...val,
          label: val.name,
          state: index === this.lastSelectedIndex ? 'active' : 'inactive',
        };
      });
      this.partners = partners.map((partner) => {
        return {
          ...partner,
          isChecked: false,
        };
      });
      let alltypesIds = Object.keys(this.typePartnerMap);

      this.partners.map((partner) => {
        alltypesIds.map((id: any) => {
          if (partner.type_ids.indexOf(parseInt(id)) >= 0) {
            this.typePartnerMap[id] = [...this.typePartnerMap[id], partner];
          }
        });
      });
      this.partnerLists = this.typePartnerMap[alltypesIds[0]];
    });
  }

  handleMenuClick(listIndex) {
    this.leftMenu[this.lastSelectedIndex].state = 'inactive';
    this.leftMenu[listIndex].state = 'active';
    this.lastSelectedIndex = listIndex;
    this.partnerLists = this.typePartnerMap[this.leftMenu[listIndex].id];
  }

  // NOT GETTING USED FOR NOW
  // ngOnDestroy(): void {
    // this.store.dispatch(new DeletePartnershipData()); 
  // }
}


