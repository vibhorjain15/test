import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import * as $ from 'jquery';
import { Select, Store } from '@ngxs/store';
import 'jquery-mapael';
import 'jquery-mapael/js/maps/world_countries.js';
import { UtilsService } from 'src/app2/services/utils.service';
import { UserState } from 'src/app2/store/user/user.state';
import { take, tap } from 'rxjs/operators';
import { GetCurrentUser } from 'src/app2/store/user/user.action';

@Component({
  selector: 'app-world-map',
  templateUrl: './world-map.component.html',
  styleUrls: ['./world-map.component.css'],
})
export class WorldMapComponent implements OnInit {
  @Input() options;
  countries_obj;
  @Select(UserState.getFirmPreferenceData) firmPref;
  constructor(private readonly Utils: UtilsService) {}

  loadMap(): void {
    $('.mapael-container').mapael({
      map: {
        name: 'world_countries',
        defaultArea: {
          attrs: { fill: 'lightgray', stroke: '#fdfdfd', 'stroke-width': 1 },
          attrsHover: { 'stroke-width': 2 },
        },
      },
      areas: this.countries_obj,
    });
  }

  ngOnInit(): void {
    this.init();
  }
  init() {
    this.firmPref.pipe(take(1)).subscribe((pref) => {
      if (pref) {
        const colorScheme = this.Utils.getFirmColorScheme(pref) || [
          '#a90e63',
          '#ffc23f',
          '#f08700',
          '#702169',
          '#087e8b',
        ];
        this.countries_obj = {};
        this.options.data.forEach((country_item, i) => {
          const country_obj = {
            attrs: {
              fill: colorScheme[i],
            },
            tooltip: {
              content: country_item.tooltip,
            },
          };
          this.countries_obj[country_item.country] = country_obj;
        });
        this.loadMap();
      }
    });
  }
}
