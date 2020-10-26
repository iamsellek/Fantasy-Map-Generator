getUniqueArrayLengths = (array) => {
  const unique = {};

  array.forEach((item) => {
    const length = item.length;
    unique[length] = unique[length] ? unique[length] + 1 : 1;
  });

  return unique;
};

getUniqueArrayValues = (array) => {
  const unique = {};

  array.forEach((item) => {
    unique[item] = unique[item] ? unique[item] + 1 : 1;
  });

  return unique;
};

getObjectLengths = (array) => {
  const unique = {};

  array.forEach((item) => {
    numOfKeys = Object.keys(item).length;
    unique[numOfKeys] = unique[numOfKeys] ? unique[numOfKeys] + 1 : 1;
  });

  return unique;
};

getUniqueObjectKeyCount = (array, key) => {
  const unique = {};

  array.forEach((item) => {
    thing = item[key];
    unique[thing] = unique[thing] ? unique[thing] + 1 : 1;
  });

  return unique;
};

getAllUniqueKeysInObjectArray = (array) => {
  const unique = {};

  array.forEach((item) => {
    const keys = Object.keys(item);

    keys.forEach((key) => {
      unique[key] = unique[key] ? unique[key] + 1 : 1;
    });
  });

  return unique;
};
