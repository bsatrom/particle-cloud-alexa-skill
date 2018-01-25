// Utility functions for My Particle Alexa Skill

const normalizeDeviceName = (name) => {
  return name ? name.toLowerCase().replace(/[-_]+/g, ' ') : '';
};

const normalizeFunctionName = (name) => {
  const functionWords = name.split(' ');

  let normalizedName = functionWords.map((word, index) => {
    if (index === 0) {
      return word;
    } else {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
  }).join('');

  return normalizedName;
};

const sayArray = (items, penultimateWord = 'and') => {
  let result = '';

  items.forEach((element, index, arr) => {
      
      if (index === 0) {
          result = element;
      } else if (index === items.length - 1) {
          result += ` ${penultimateWord} ${element}`;
      } else {
          result += `, ${element}`;
      }
  });
  return result;
};

exports.utils = {
  normalizeDeviceName,
  normalizeFunctionName,
  sayArray
};