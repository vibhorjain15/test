export enum assignReviewer {
  Newly_Assign = 'New Review',
  Copy_Reviewer = 'Copy Reviewers',
  definition = 'Review Definitions',
}
export const subcategoryFilter = [
  {
    name: 'All Categories & Sub-Categories',
    id: 'all',
  },
  {
    name: 'Select Categories & Sub-Categories',
    id: 'select',
  },
];

export const entity_type_investor = [
  { name: 'Product', id: 'Fund' },
  { name: 'Firm', id: 'Firm' },
  { name: 'Vehicle', id: 'Vehicle' },
  { name: 'Strategy', id: 'Strategy' },
];

export const entity_type_manager = [
  { name: 'Product', id: 'Fund' },
  { name: 'My Firm', id: 'Myfirm' },
  { name: 'Vehicle', id: 'Vehicle' },
  { name: 'Strategy', id: 'Strategy' },
];
