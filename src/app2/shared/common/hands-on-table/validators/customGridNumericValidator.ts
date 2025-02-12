export function customGridNumericValidator(query, callback) {
  if (query && query != '' && !numberIsDecimal(query)) callback(false);
  else callback(true);
}

function numberIsDecimal(query) {
  let regexPattern = /^[-+]?[0-9]+\.*[0-9]*$/;
  return regexPattern.test(query.toString());
}
