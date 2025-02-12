import { dvTabsList } from 'src/app2/shared/components/dv-tabs/dv-tabs.model';

export const entityTabs = {
  firms: function FirmsTab(
    user,
    issue_tracker_default_name,
    params
  ): dvTabsList[] {
    return [
      {
        name: 'Monitor',
        link: `/app/firms/${params.firmId}/profile/monitor`,
        active: false,
        condition: true,
      },
      {
        name: 'AUM & Track Record',
        link: `/app/firms/${params.firmId}/profile/aum_tr`,
        active: false,
        condition: !user.isFreeSubscription,
      },
      {
        name: 'Documents',
        link: `/app/firms/${params.firmId}/profile/documents/list`,
        active: false,
        condition: true,
      },
      {
        name: 'Addresses',
        link: `/app/firms/${params.firmId}/profile/address`,
        active: false,
        condition: true,
      },
      {
        name: 'Related Products',
        link: `/app/firms/${params.firmId}/profile/related_entities`,
        active: false,
        condition: user.isInvestor,
      },
      {
        name: 'Associated Contacts',
        link: `/app/firms/${params.firmId}/profile/associated_contacts`,
        active: false,
        condition: true,
      },
      {
        name: issue_tracker_default_name,
        link: `/app/firms/${params.firmId}/profile/recommendations`,
        active: false,
        condition: issue_tracker_default_name,
      },
    ];
  },
  strategies: function strategiesTab(
    user,
    issue_tracker_default_name,
    params
  ): dvTabsList[] {
    return [
      {
        name: 'Summary',
        link: `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/summary`,
        active: false,
        condition: !user.isFreeSubscription,
      },
      {
        name: 'Monitor',
        link: `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/monitor`,
        active: false,
        condition: true,
      },
      {
        name: 'AUM & Track Record',
        link: `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/aum_tr`,
        active: false,
        condition: true,
      },
      {
        name: 'DDQ',
        link: `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/ddq`,
        active: false,
        condition: !user.isInvestor,
      },
      {
        name: 'Documents',
        link: `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/documents/list`,
        active: false,
        condition: !user.isFreeManager,
      },
      {
        name: 'Related Strategies',
        link: `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/related_entities`,
        active: false,
        condition: user.isInvestor && !user.isFreeSubscription,
      },
      {
        name: 'Associated Contacts',
        link: `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/contacts`,
        active: false,
        condition: true,
      },
      {
        name: 'Associated Products',
        link: `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/associated_entities`,
        active: false,
        condition: true,
      },
      {
        name: issue_tracker_default_name,
        link: `/app/firms/${params.firmId}/strategies/${params.strategyId}/profile/recommendations`,
        active: false,
        condition: issue_tracker_default_name,
      },
    ];
  },
  vehicles: function vehicleTab(
    user,
    issue_tracker_default_name,
    params
  ): dvTabsList[] {
    return [
      {
        name: 'Monitor',
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/vehicles/${params.vehicleId}/profile/monitor`,
        active: false,
        condition: true,
      },
      {
        name: 'AUM & Track Record',
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/vehicles/${params.vehicleId}/profile/aum_tr`,
        active: false,
        condition: true,
      },
      {
        name: 'DDQ',
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/vehicles/${params.vehicleId}/profile/ddq`,
        active: false,
        condition: !user.isInvestor,
      },
      {
        name: 'Document',
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/vehicles/${params.vehicleId}/profile/documents/list`,
        active: false,
        condition: !user.isFreeManager,
      },
      {
        name: 'Related Vehicles',
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/vehicles/${params.vehicleId}/profile/related_vehicles`,
        active: false,
        condition: true,
      },
      {
        name: issue_tracker_default_name,
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/vehicles/${params.vehicleId}/profile/recommendations`,
        active: false,
        condition: issue_tracker_default_name,
      },
    ];
  },
  funds: function fundsTab(
    user,
    issue_tracker_default_name,
    params
  ): dvTabsList[] {
    return [
      {
        name: 'Summary',
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/profile/summary`,
        active: false,
        condition: !user.isFreeSubscription,
      },
      {
        name: 'Monitor',
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/profile/monitor`,
        active: false,
        condition: true,
      },
      {
        name: 'AUM & Track Record',
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/profile/aum_tr`,
        active: false,
        condition: true,
      },
      {
        name: 'DDQ',
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/profile/ddq`,
        active: false,
        condition: !user.isInvestor,
      },
      {
        name: 'Documents',
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/profile/documents/list`,
        active: false,
        condition: !user.isFreeManager,
      },
      {
        name: 'Related Products',
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/profile/related_entities`,
        active: false,
        condition: user.isInvestor && !user.isFreeSubscription,
      },
      {
        name: 'Associated Contacts',
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/profile/contacts`,
        active: false,
        condition: true,
      },
      {
        name: 'Associated Vehicles',
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/profile/vehicles`,
        active: false,
        condition: true,
      },
      {
        name: issue_tracker_default_name,
        link: `/app/firms/${params.firmId}/funds/${params.fundId}/profile/recommendations`,
        active: false,
        condition: issue_tracker_default_name,
      },
    ];
  },
  my_firm: function myFirmTab(
    user,
    issue_tracker_default_name,
    params
  ): dvTabsList[] {
    return [
      {
        name: 'DDQs',
        link: '/app/monitor/my_firm/profile/ddqs',
        active: false,
        condition: true,
      },
      {
        name: 'AUM & Track Record',
        link: '/app/monitor/my_firm/profile/aum_tr',
        active: false,
        condition: true,
      },
      {
        name: 'Documents',
        link: '/app/monitor/my_firm/profile/documents/list',
        active: false,
        condition: true,
      },
      {
        name: 'Addresses',
        link: '/app/monitor/my_firm/profile/address',
        active: false,
        condition: true,
      },
      {
        name: 'Associated Contacts',
        link: '/app/monitor/my_firm/profile/contacts',
        active: false,
        condition: true,
      },
      {
        name: issue_tracker_default_name,
        link: '/app/monitor/my_firm/profile/recommendations',
        active: false,
        condition: issue_tracker_default_name,
      },
    ];
  },
};
