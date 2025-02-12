export const sortRules = (allRules, categories, allQuestions) => {
  let subCatIDs = {};
  allQuestions.forEach((ques) => (ques['rules'] = []));
  Object.values(categories).forEach((cat: any) => {
    cat['rules'] = [];
    Object.values(cat.list).forEach((subCat: any) => {
      subCatIDs[subCat.id] = cat.id;
      cat.list[subCat.id]['rules'] = [];
      cat.list[subCat.id]['questions'] = allQuestions.filter(
        (ques) => ques.sectionID == subCat.id
      );
    });
  });
  let allRulesArray = JSON.parse(JSON.stringify(allRules));

  allRulesArray.forEach((rule) => {
    Object.values(categories).forEach((cat: any) => {
      Object.values(cat.list).forEach((subCat: any) => {
        if (rule.destination_entity_type == DestinationEntityType.Question) {
          categories[subCatIDs[subCat.id]].list[subCat.id]['questions'].forEach(
            (ques) => {
              if (rule.destination_entity_id == ques.group_id) {
                ques['rules'].push(rule);
              }
            }
          );
        }

        if (rule.destination_entity_type == DestinationEntityType.Subsection) {
          if (subCat.group_id == rule.destination_entity_id)
            categories[subCatIDs[subCat.id]].list[subCat.id]['rules'].push(
              rule
            );
        }
      });
      if (rule.destination_entity_type == DestinationEntityType.Section) {
        if (rule.destination_entity_id == cat.group_id) {
          categories[cat.id]['rules'].push(rule);
        }
      }
    });
  });

  let allProjectRules = [];
  allRulesArray.forEach((rule) => {
    if (rule.destination_entity_type == DestinationEntityType.Duediligence) {
      allProjectRules.push(rule);
    }
  });
  let rules = [];
  Object.values(categories).forEach((cat: any) => {
    Object.values(cat.list).forEach((subCat: any) => {
      cat.list[subCat.id]['questions'].forEach((ques) => {
        if (ques['rules'].length) rules.push({ list: [...ques['rules']] });
      });
      if (cat.list[subCat.id]['rules'].length)
        rules.push({ list: [...cat.list[subCat.id]['rules']] });
    });
    if (cat['rules'].length) rules.push({ list: [...cat['rules']] });
  });

  if (allProjectRules?.length) {
    rules.push({ list: [...allProjectRules] });
  }

  for (var i = 0; i < rules.length; i++) {
    rules[i].list = rules[i].list.sort((rule1, rule2) =>
      (rule1.updated_at || rule1.created_at) >
      (rule2.updated_at || rule2.created_at)
        ? -1
        : 1
    );
  }

  return rules;
};

export enum DestinationEntityType {
  Question = 'Question',
  Subsection = 'Subsection',
  Section = 'Section',
  Duediligence = 'Duediligence',
}
