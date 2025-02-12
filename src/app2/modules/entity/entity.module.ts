import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ManageFirmsComponent } from './firms/manage-firms/manage-firms.component';
import { SharedModule } from 'src/app2/shared/shared.module';
import { ManageStrategiesComponent } from './strategy/manage-strategies/manage-strategies.component';
import { ManageProductsComponent } from './products/manage-products/manage-products.component';
import { ManageVehiclesComponent } from './vehicle/manage-vehicles/manage-vehicles.component';
import { ManageContactsComponent } from './contact/manage-contacts/manage-contacts.component';
import { StrategiesSummaryComponent } from './strategy/strategies-summary/strategies-summary.component';
import { StrategiesMonitorComponent } from './strategy/strategies-monitor/strategies-monitor.component';
import { StrategiesRelatedStrategiesComponent } from './strategy/strategies-related-strategies/strategies-related-strategies.component';
import { StrategiesAssociatedContactsComponent } from './strategy/strategies-associated-contacts/strategies-associated-contacts.component';
import { StrategiesAssociatedProductsComponent } from './strategy/strategies-associated-products/strategies-associated-products.component';
import { StrategiesAumTrComponent } from './strategy/strategies-aum-tr/strategies-aum-tr.component';
import { ProductsAumTrComponent } from './products/products-aum-tr/products-aum-tr.component';
import { ProductsAssociatedContactsComponent } from './products/products-associated-contacts/products-associated-contacts.component';
import { ProductsAssociatedVehiclesComponent } from './products/products-associated-vehicles/products-associated-vehicles.component';
import { VehiclesAumTrComponent } from './vehicle/vehicles-aum-tr/vehicles-aum-tr.component';
import { ContactsComponent } from './contact/contacts/contacts.component';
import { ProductsMonitorComponent } from './products/products-monitor/products-monitor.component';
import { ProductsRelatedProductsComponent } from './products/products-related-products/products-related-products.component';
import { ProductsSummaryComponent } from './products/products-summary/products-summary.component';
import { VehiclesMonitorComponent } from './vehicle/vehicles-monitor/vehicles-monitor.component';
import { VehiclesRelatedVehiclesComponent } from './vehicle/vehicles-related-vehicles/vehicles-related-vehicles.component';
import { FirmsMonitorComponent } from './firms/firms-monitor/firms-monitor.component';
import { FirmsAumTrComponent } from './firms/firms-aum-tr/firms-aum-tr.component';
import { FirmsAddressesComponent } from './firms/firms-addresses/firms-addresses.component';
import { FirmsRelatedProductsComponent } from './firms/firms-related-products/firms-related-products.component';
import { FirmsAssociatedContactsComponent } from './firms/firms-associated-contacts/firms-associated-contacts.component';
import { ProductsMonitorManagerComponent } from './products/products-monitor-manager/products-monitor-manager.component';
import { StrategyDdqComponent } from './strategy/strategy-ddq/strategy-ddq.component';
import { ProfileDdqComponent } from './strategy/profile-ddq/profile-ddq.component';
import { MyFirmDdqsComponent } from './my-firm/my-firm-ddqs/my-firm-ddqs.component';
import { FundDdqsComponent } from './my-firm/fund-ddqs/fund-ddqs.component';
import { MyFirmAumTrComponent } from './my-firm/my-firm-aum-tr/my-firm-aum-tr.component';
import { MyFirmAddressComponent } from './my-firm/my-firm-address/my-firm-address.component';
import { MyFirmContactsComponent } from './my-firm/my-firm-contacts/my-firm-contacts.component';
import { ProductsDdqComponent } from './products/products-ddq/products-ddq.component';
import { SendToManagerComponent } from './products/send-to-manager/send-to-manager.component';
import { FirmsRecommendationsComponent } from './firms/firms-recommendations/firms-recommendations.component';
import { VehiclesRecommendationsComponent } from './vehicle/vehicles-recommendations/vehicles-recommendations.component';
import { ProductsRecommendationsComponent } from './products/products-recommendations/products-recommendations.component';
import { StrategiesRecommendationsComponent } from './strategy/strategies-recommendations/strategies-recommendations.component';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { EntityTabsComponent } from './entity-tabs/entity-tabs.component';
import { VehiclesDdqComponent } from './vehicle/vehicles-ddq/vehicles-ddq.component';
import { UnsavedChangeService } from './shared/unsaved-change.service';
import { ENTITY_ROUTES } from './entity.routes';
import { MeetingReRoutePageComponent } from 'src/app2/pages/meeting-reroute/meeting-reroute.component';

import { EntityDocumentComponent } from './entity-document/entity-document.component';
@NgModule({
  declarations: [
    ManageFirmsComponent,
    ManageStrategiesComponent,
    ManageProductsComponent,
    ManageVehiclesComponent,
    ManageContactsComponent,
    StrategiesSummaryComponent,
    StrategiesMonitorComponent,
    StrategiesRelatedStrategiesComponent,
    StrategiesAssociatedContactsComponent,
    StrategiesAssociatedProductsComponent,
    StrategiesAumTrComponent,
    ProductsSummaryComponent,
    ProductsMonitorComponent,
    ProductsAumTrComponent,
    ProductsRelatedProductsComponent,
    ProductsAssociatedContactsComponent,
    ProductsAssociatedVehiclesComponent,
    VehiclesMonitorComponent,
    VehiclesAumTrComponent,
    VehiclesRelatedVehiclesComponent,
    ContactsComponent,
    FirmsMonitorComponent,
    FirmsAumTrComponent,
    FirmsAddressesComponent,
    FirmsRelatedProductsComponent,
    FirmsAssociatedContactsComponent,
    ProductsMonitorManagerComponent,
    StrategyDdqComponent,
    ProfileDdqComponent,
    MyFirmDdqsComponent,
    FundDdqsComponent,
    MyFirmAumTrComponent,
    MyFirmAddressComponent,
    MyFirmContactsComponent,
    ProductsDdqComponent,
    SendToManagerComponent,
    FirmsRecommendationsComponent,
    VehiclesRecommendationsComponent,
    ProductsRecommendationsComponent,
    StrategiesRecommendationsComponent,
    EntityTabsComponent,
    VehiclesDdqComponent,
    MeetingReRoutePageComponent,
    EntityDocumentComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RecommendationModule,
    RouterModule.forChild(ENTITY_ROUTES),
  ],
  providers: [UnsavedChangeService],
})
export class EntityModule {}
