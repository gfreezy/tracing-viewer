
function toCamel(s: string) {
  return s.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace('-', '')
      .replace('_', '');
  });
}

function isArray(a: any) {
  return Array.isArray(a);
}

function isObject(o: any) {
  return o === Object(o) && !isArray(o) && typeof o !== 'function';
}

export function jsonToCamelCase(o: any) {
  if (isObject(o)) {
    const n = {};

    Object.keys(o)
      .forEach((k) => {
        n[toCamel(k)] = jsonToCamelCase(o[k]);
      });

    return n;
  } else if (isArray(o)) {
    return o.map((i: any) => {
      return jsonToCamelCase(i);
    });
  }

  return o;
}
