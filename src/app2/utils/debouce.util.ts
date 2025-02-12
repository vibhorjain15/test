export const debouncer = (func, time = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = func.apply(this, args);
    }, time);
  };
};
