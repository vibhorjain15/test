export const removeAllTrailingSpaces = (value) => {
  const needToRemove = `&nbsp;`;
  const lastIndex = value.indexOf(
    needToRemove,
    value.length - needToRemove.length
  );
  if (lastIndex > 0) {
    value = value.substring(0, lastIndex).trim();
    return removeAllTrailingSpaces(value);
  }
  return value;
};
export const removeAllTrailingBreaks = (value) => {
  const needToRemove = `<br />`;
  const lastIndex = value.indexOf(
    needToRemove,
    value.length - needToRemove.length
  );
  if (lastIndex > 0) {
    value = value.substring(0, lastIndex).trim();
    return removeAllTrailingBreaks(value);
  }
  return value;
};

export const removeAllTrailingBreaksAndSpace = (value) => {
  const breaks = `<br />`;
  const lastIndex1 = value.indexOf(breaks, value.length - breaks.length);
  if (lastIndex1 > 0) {
    value = value.substring(0, lastIndex1).trim();
    value = removeAllTrailingBreaks(value);
    return removeAllTrailingBreaksAndSpace(value);
  }
  const space = `&nbsp;`;
  const lastIndex2 = value.indexOf(space, value.length - space.length);
  if (lastIndex2 > 0) {
    value = value.substring(0, lastIndex2).trim();
    value = removeAllTrailingSpaces(value);
    return removeAllTrailingBreaksAndSpace(value);
  }
  return value;
};
