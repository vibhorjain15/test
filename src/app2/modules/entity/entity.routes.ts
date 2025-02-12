import { Routes } from '@angular/router';

import { ManageStrategiesComponent } from './strategy/manage-strategies/manage-strategies.component';
import { ManageFirmsComponent } from './firms/manage-firms/manage-firms.component';
import { ManageProductsComponent } from './products/manage-products/manage-products.component';
import { ManageVehiclesComponent } from './vehicle/manage-vehicles/manage-vehicles.component';
import { ManageContactsComponent } from './contact/manage-contacts/manage-contacts.component';
import { EntityTabsComponent } from './entity-tabs/entity-tabs.component';
import { FirmsMonitorComponent } from './firms/firms-monitor/firms-monitor.component';
import { FirmsAumTrComponent } from './firms/firms-aum-tr/firms-aum-tr.component';
import { FirmsAddressesComponent } from './firms/firms-addresses/firms-addresses.component';
import { FirmsRelatedProductsComponent } from './firms/firms-related-products/firms-related-products.component';
import { FirmsAssociatedContactsComponent } from './firms/firms-associated-contacts/firms-associated-contacts.component';
import { FirmsRecommendationsComponent } from './firms/firms-recommendations/firms-recommendations.component';
import { StrategiesSummaryComponent } from './strategy/strategies-summary/strategies-summary.component';
import { StrategiesMonitorComponent } from './strategy/strategies-monitor/strategies-monitor.component';
import { StrategiesAumTrComponent } from './strategy/strategies-aum-tr/strategies-aum-tr.component';
import { StrategyDdqComponent } from './strategy/strategy-ddq/strategy-ddq.component';
import { StrategiesRelatedStrategiesComponent } from './strategy/strategies-related-strategies/strategies-related-strategies.component';
import { StrategiesAssociatedContactsComponent } from './strategy/strategies-associated-contacts/strategies-associated-contacts.component';
import { StrategiesAssociatedProductsComponent } from './strategy/strategies-associated-products/strategies-associated-products.component';
import { StrategiesRecommendationsComponent } from './strategy/strategies-recommendations/strategies-recommendations.component';
import { ProductsSummaryComponent } from './products/products-summary/products-summary.component';
import { ProductsMonitorComponent } from './products/products-monitor/products-monitor.component';
import { ProductsAumTrComponent } from './products/products-aum-tr/products-aum-tr.component';
import { ProductsDdqComponent } from './products/products-ddq/products-ddq.component';
import { ProductsRelatedProductsComponent } from './products/products-related-products/products-related-products.component';
import { ProductsAssociatedContactsComponent } from './products/products-associated-contacts/products-associated-contacts.component';
import { ProductsAssociatedVehiclesComponent } from './products/products-associated-vehicles/products-associated-vehicles.component';
import { ProductsRecommendationsComponent } from './products/products-recommendations/products-recommendations.component';
import { VehiclesMonitorComponent } from './vehicle/vehicles-monitor/vehicles-monitor.component';
import { VehiclesDdqComponent } from './vehicle/vehicles-ddq/vehicles-ddq.component';
import { VehiclesAumTrComponent } from './vehicle/vehicles-aum-tr/vehicles-aum-tr.component';
import { VehiclesRelatedVehiclesComponent } from './vehicle/vehicles-related-vehicles/vehicles-related-vehicles.component';
import { VehiclesRecommendationsComponent } from './vehicle/vehicles-recommendations/vehicles-recommendations.component';
import { MyFirmDdqsComponent } from './my-firm/my-firm-ddqs/my-firm-ddqs.component';
import { MyFirmAumTrComponent } from './my-firm/my-firm-aum-tr/my-firm-aum-tr.component';
import { MyFirmContactsComponent } from './my-firm/my-firm-contacts/my-firm-contacts.component';
import { MyFirmAddressComponent } from './my-firm/my-firm-address/my-firm-address.component';
import { FundReRoutePageComponent } from 'src/app2/pages/fund-reroute/fund-reroute.component';
import { MeetingsDetailComponent } from 'src/app2/shared/common/dv-meetings/meetings-detail/meetings-detail.component';
import { MeetingReRoutePageComponent } from 'src/app2/pages/meeting-reroute/meeting-reroute.component';
import { DvDocumentGridComponent } from 'src/app2/shared/components/dv-document-grid/dv-document-grid.component';
import { CanAccessGaurd } from 'src/app2/guards/canAccess.gaurd';
import { EntityDocumentComponent } from './entity-document/entity-document.component';

const ENTITY_MONITOR_ROUTE_NAMES = {
  FIRMS: 'firms',
  STRATEGIES: 'strategies',
  PRODUCTS: 'investments',
  VEHICLES: 'vehicles',
  CONTACTS: 'contacts',
  MEETING: 'meetings/:Id/detail',
} as const;

const ENTITY_PROFILE_ROUTE_NAMES = {
  MY_FIRM_PARENT: 'my_firm',
  MY_FIRM_PROFILE: 'profile',
  DDQS: 'profile/ddqs',
  AUM_TR: 'profile/aum_tr',
  DOCUMENTS_LIST: 'profile/documents/list',
  PROFILE_CONTACTS: 'profile/contacts',
  ADDRESS: 'profile/address',
  RECOMMENDATIONS: 'profile/recommendations',
  FIRMS: ':firmId/profile',
  FIRM_AUM_TR: ':firmId/profile/aum_tr',
  STRATEGIES: ':firmId/strategies/:strategyId/profile',
  PRODUCTS: ':firmId/funds/:fundId/profile',
  VEHICLES: ':firmId/funds/:fundId/vehicles/:vehicleId/profile',
} as const;

const ENTITY_MEETING_ROUTE_NAMES = {
  FIRMS: ':firmId/meetings/:Id/detail',
  STRATEGIES: ':firmId/strategies/:strategyId/meetings/:Id/detail',
  PRODUCTS: ':firmId/funds/:fundId/meetings/:Id/detail',
};

const ENTITY_MONITOR_ROUTES: Routes = [
  {
    path: '',
    redirectTo: '/app/home',
    pathMatch: 'full',
  },
  {
    path: ENTITY_MONITOR_ROUTE_NAMES.FIRMS,
    component: ManageFirmsComponent,
  },
  {
    path: ENTITY_MONITOR_ROUTE_NAMES.STRATEGIES,
    component: ManageStrategiesComponent,
  },
  {
    path: ENTITY_MONITOR_ROUTE_NAMES.PRODUCTS,
    component: ManageProductsComponent,
  },
  {
    path: ENTITY_MONITOR_ROUTE_NAMES.VEHICLES,
    component: ManageVehiclesComponent,
  },
  {
    path: ENTITY_MONITOR_ROUTE_NAMES.CONTACTS,
    component: ManageContactsComponent,
  },
  {
    path: ENTITY_MONITOR_ROUTE_NAMES.MEETING,
    component: MeetingReRoutePageComponent,
  },
];

export const ENTITY_ROUTES: Routes = [
  ...ENTITY_MONITOR_ROUTES,
  {
    canActivate: [CanAccessGaurd],
    path: ENTITY_PROFILE_ROUTE_NAMES.MY_FIRM_PARENT,
    component: EntityTabsComponent,
    data: { entityType: 'my_firm', hidden_from: ['investor'] },
    children: [
      {
        path: ``,
        redirectTo: `${ENTITY_PROFILE_ROUTE_NAMES.MY_FIRM_PROFILE}/ddqs`,
        pathMatch: 'full'
      },
      {
        path: ENTITY_PROFILE_ROUTE_NAMES.MY_FIRM_PROFILE,
        redirectTo: `${ENTITY_PROFILE_ROUTE_NAMES.MY_FIRM_PROFILE}/ddqs`,
        pathMatch: 'full'
      },
      {
        path: ENTITY_PROFILE_ROUTE_NAMES.DDQS,
        component: MyFirmDdqsComponent,
      },
      {
        path: ENTITY_PROFILE_ROUTE_NAMES.AUM_TR,
        component: MyFirmAumTrComponent,
      },
      {
        path:  ENTITY_PROFILE_ROUTE_NAMES.DOCUMENTS_LIST,
        component: EntityDocumentComponent,
      },
      {
        path: ENTITY_PROFILE_ROUTE_NAMES.PROFILE_CONTACTS,
        component: MyFirmContactsComponent,
      },
      {
        path: ENTITY_PROFILE_ROUTE_NAMES.ADDRESS,
        component: MyFirmAddressComponent,
      },
      {
        path: ENTITY_PROFILE_ROUTE_NAMES.RECOMMENDATIONS,
        component: FirmsRecommendationsComponent,
      },
    ],
  },
  {
    path: ENTITY_PROFILE_ROUTE_NAMES.FIRMS,
    component: EntityTabsComponent,
    data: { entityType: 'firms' },
    children: [
      {
        path: 'monitor',
        component: FirmsMonitorComponent,
      },
      {
        path: ENTITY_PROFILE_ROUTE_NAMES.FIRM_AUM_TR,
        component: FirmsAumTrComponent,
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['isFreeSubscription'] },
        path: 'aum_tr',
        component: FirmsAumTrComponent,
      },
      {
        path: 'documents/list',
        component: EntityDocumentComponent,
      },
      {
        path: 'address',
        component: FirmsAddressesComponent,
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['manager'] },
        path: 'related_entities',
        component: FirmsRelatedProductsComponent,
      },
      {
        path: 'associated_contacts',
        component: FirmsAssociatedContactsComponent,
      },
      {
        path: 'recommendations',
        component: FirmsRecommendationsComponent,
      },
    ],
  },
  {
    path: ENTITY_PROFILE_ROUTE_NAMES.STRATEGIES,
    component: EntityTabsComponent,
    data: { entityType: 'strategies' },
    children: [
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['isFreeSubscription'] },
        path: 'summary',
        component: StrategiesSummaryComponent,
      },
      {
        path: 'monitor',
        component: StrategiesMonitorComponent,
      },
      {
        path: 'aum_tr',
        component: StrategiesAumTrComponent,
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['investor'] },
        path: 'ddq',
        component: StrategyDdqComponent,
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['isFreeManager'] },
        path: 'documents/list',
        component: EntityDocumentComponent,
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['manager', 'isFreeSubscription'] },
        path: 'related_entities',
        component: StrategiesRelatedStrategiesComponent,
      },
      {
        path: 'contacts',
        component: StrategiesAssociatedContactsComponent,
      },
      {
        path: 'associated_entities',
        component: StrategiesAssociatedProductsComponent,
      },
      {
        path: 'recommendations',
        component: StrategiesRecommendationsComponent,
      },
    ],
  },
  {
    path: ENTITY_PROFILE_ROUTE_NAMES.PRODUCTS,
    component: EntityTabsComponent,
    data: { entityType: 'funds' },
    children: [
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['isFreeSubscription'] },
        path: 'summary',
        component: ProductsSummaryComponent,
      },
      {
        path: 'monitor',
        component: ProductsMonitorComponent,
      },
      {
        path: 'aum_tr',
        component: ProductsAumTrComponent,
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['investor'] },
        path: 'ddq',
        component: ProductsDdqComponent,
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['isFreeManager'] },
        path: 'documents/list',
        component: EntityDocumentComponent,
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['manager', 'isFreeSubscription'] },
        path: 'related_entities',
        component: ProductsRelatedProductsComponent,
      },
      {
        path: 'contacts',
        component: ProductsAssociatedContactsComponent,
      },
      {
        path: 'vehicles',
        component: ProductsAssociatedVehiclesComponent,
      },
      {
        path: 'recommendations',
        component: ProductsRecommendationsComponent,
      },
    ],
  },
  {
    path: ENTITY_PROFILE_ROUTE_NAMES.VEHICLES,
    component: EntityTabsComponent,
    data: { entityType: 'vehicles' },
    children: [
      {
        path: 'monitor',
        component: VehiclesMonitorComponent,
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['investor'] },
        path: 'ddq',
        component: VehiclesDdqComponent,
      },
      {
        path: 'aum_tr',
        component: VehiclesAumTrComponent,
      },
      {
        canActivate: [CanAccessGaurd],
        data: { hidden_from: ['isFreeManager'] },
        path: 'documents/list',
        component: EntityDocumentComponent,
      },
      {
        path: 'related_vehicles',
        component: VehiclesRelatedVehiclesComponent,
      },
      {
        path: 'recommendations',
        component: VehiclesRecommendationsComponent,
      },
    ],
  },
  {
    path: ENTITY_MEETING_ROUTE_NAMES.FIRMS,
    component: MeetingsDetailComponent,
  },
  {
    path: ENTITY_MEETING_ROUTE_NAMES.STRATEGIES,
    component: MeetingsDetailComponent,
  },
  {
    path: ENTITY_MEETING_ROUTE_NAMES.PRODUCTS,
    component: MeetingsDetailComponent,
  },
];
