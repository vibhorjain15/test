export function customGridIntegerValidator(query, callback) {
  if (query && query != '' && !numberIsInteger(query)) callback(false);
  else callback(true);
}

function numberIsInteger(query) {
  let regexPattern = /^[-+]?[0-9]+$/;
  return regexPattern.test(query.toString());
}
