export enum AutoFill {
  From_a_Product = 'From a Product',
  From_a_Strategy = 'From a Strategy',
  From_a_Vehicle = 'From a Vehicle',
  From_Diligence_Project = 'From a Diligence Project',
  From_Mapped_Responses = 'From Mapped Responses',
  Most_Recent = 'Most Recent',
}
export enum AutoFillTooltip {
  From_a_Product = 'Auto-fill specific to a product',
  From_a_Strategy = 'Auto-fill specific to a strategy',
  From_a_Vehicle = 'Auto-fill specific to a vehicle',
  From_Diligence_Project = 'Auto-fill from a diligence project',
  From_Mapped_Responses = 'Auto-fill from Mapped Responses',
  Most_Recent = 'Auto-fill most recent responses',
}
export enum TabType {
  Standard,
  Advanced,
}
export enum AutoFillTabType {
  Standard = 'Standard',
  Advanced = 'Advanced',
}

export const autoFillHistoryParse = (autoFillHistory, currentuser) => {
  autoFillHistory.forEach((history) => {
    if (history.source_tab === 'Advanced') {
      history.source_entity_name_prefix = 'the ';
      history.source_entity_name = 'Advanced Tab';
    } else if (!history.source_entity_name) {
      if (
        currentuser.isManager &&
        !currentuser.isFreeSubscription &&
        history.is_es_autofilled // check whether it was database or es autofill
      ) {
        history.source_entity_name_prefix = 'the ';
        history.source_entity_name = 'Q/A Center';
      } else if (history.type === 'Mapped Responses') {
        history.source_entity_name = 'Mapped Responses';
      } else {
        history.source_entity_name = 'Most Recent';
      }
    }
  });
};
