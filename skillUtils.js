// Utility functions for My Particle Alexa Skill

const normalizeDeviceName = (name) => {
  return name.toLowerCase().replace(/[-_]+/g, ' ')
}

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
}

exports.utils = {
  normalizeDeviceName,
  sayArray
}