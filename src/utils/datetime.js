function getTimeDiffSeconds(start, end) {
  const t1 = new Date(start);
  const t2 = new Date(end);
  return ((t2 - t1) / 1000).toFixed(2);
}

module.exports = {
  getTimeDiffSeconds,
};
