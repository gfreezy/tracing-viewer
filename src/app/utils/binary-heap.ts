export function insertOrUpdate<T>(
  array: T[], target: T,
  eq: (l: T, r: T) => boolean,
  cmp: (l: T, r: T) => number,
  update?: (oldValue: T, newValue: T) => void
) {
  let startIndex = 0;
  let endIndex = array.length - 1;
  while (startIndex <= endIndex) {
    const middleIndex = Math.floor((startIndex + endIndex) / 2);
    const oldValue = array[middleIndex];
    const compare = cmp(target, oldValue);
    if (eq(oldValue, target)) {
      if (update != null) {
        update(oldValue, target);
      }
      return;
    } else if (compare > 0) {
      startIndex = middleIndex + 1;
    } else if (compare < 0) {
      endIndex = middleIndex - 1;
    }
  }

  array.splice(startIndex, 0, target);
}
