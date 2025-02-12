export function customFormulaValidatorFunction(
  value,
  instance,
  is_dynamic
): boolean {
  let sourceData = instance.instance.getSourceDataAtCell(
    instance.row,
    instance.col
  );
  if (
    (value &&
      value != '' &&
      value.toString().startsWith('#') &&
      value.toString() != '#VALUE!' &&
      value.toString() != '#DIV/0!' &&
      value.toString() != '#N/A') ||
    (sourceData && !sourceData.toString().startsWith('='))
  )
    return false;
  else {
    if (is_dynamic && instance.row == 1) {
      //hard coded check to see if the row is aggregation row
      let rangeRegex = /\w+\((\w+\$?\d+:\w+\$?\d+)\)/;
      if (
        (sourceData && sourceData.toString().match(rangeRegex)) ||
        !sourceData
      ) {
        return true;
      } else {
        return false;
      }
    } else return true;
  }
}
