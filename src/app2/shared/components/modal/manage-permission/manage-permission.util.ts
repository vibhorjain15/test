import { keywordConstants } from 'src/app2/shared/constants/constant';

export const getDiligenceType = (isManager: boolean) => {
  let type = [
    { name: 'Firm', value: 'Firm' },
    { name: 'Product', value: 'Fund' },
  ];
  if (isManager) {
    type = [
      { name: 'My Firm', value: keywordConstants.MyFirm },
      { name: 'Product', value: 'Fund' },
    ];
  }
  return type;
};

export const filtersConstants = {
  Firm: {
    tag_id: 'tag_id',
    relationship_status_id: 'relationship_status_id',
  },
  Fund: {
    tag_id: 'tag_id',
    relationship_status_id: 'relationship_status_id',
    strategyID: 'strategyID',
  },
  DueDiligence: {},
  Template: {},
};

export const accessLevelTypes = {
  Private: 'Private',
  All: 'All',
};
