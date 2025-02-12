// Output => dd mmm yyyy example 16 dec, 2022
export const yearMonthDayFormat = (date) =>
  new Date(date).toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
