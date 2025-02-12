export function sortByFirstNames(a, b, key = 'name') {
  a = a[key] ? a[key] : a.userName;
  b = b[key] ? b[key] : b.userName;
  if (a?.toLowerCase() < b?.toLowerCase()) {
    return -1;
  }
  if (a?.toLowerCase() > b?.toLowerCase()) {
    return 1;
  }
  return 0;
}
