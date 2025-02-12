export function isNumeric(n) {
  /* eslint-disable */
  var t = typeof n;

  return t == 'number' ? !isNaN(n) && isFinite(n) :
    t == 'string' ? !n.length ? false :
      n.length == 1 ? /\d/.test(n) :
        /^\s*[+-]?\s*(?:(?:\d+(?:\.\d+)?(?:e[+-]?\d+)?)|(?:0x[a-f\d]+))\s*$/i.test(n) :
      t == 'object' ? !!n && typeof n.valueOf() == 'number' && !(n instanceof Date) : false;
}