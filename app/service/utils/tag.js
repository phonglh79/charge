'use strict';

/**
 * Tag service is used to calculate the tag from speicifc url.
 */
module.exports = (app) => {
  class TagService extends app.Service {
    fetchTag(pathArray, url) {
      if (pathArray.length > 0) {
        switch (pathArray[1]) {
          case 'listeners.json':
            return 'listener';
        }

        if (pathArray.length > 2 && pathArray[2] === 'restore') {
          return 'volume';
        }
        if (pathArray[0] === 'floatingips.json') {
          return 'floatingip';
        } else if (pathArray[0] === 'volumes_boot') {
          return 'volumesboot';
        }
      }
      return pathArray[0].replace(/(e*)s$/, '$1').replace(/\.json$/, '');
    }
  }
  return TagService;
};
