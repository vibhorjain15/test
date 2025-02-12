var RegExp

try {
  new RegExp('a', 'u');
} catch (err) {
  global.RegExp = function (pattern, flags) {
    if (flags && flags.includes('u')) {
      return new RegExp(rewritePattern(pattern, flags, generateRegexpuOptions({
        flags: flags,
        pattern: pattern
      })));
    }

    return new RegExp(pattern, flags);
  };

  global.RegExp.prototype = RegExp;
}
