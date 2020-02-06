const _rp = require('request-promise');
const _ = require('lodash');
//prevent ETIMEDOUT error from connections.
process.env.UV_THREADPOOL_SIZE = 128; //https://stackoverflow.com/questions/24320578/node-js-get-request-etimedout-esockettimedout/37946324#37946324

/**
 *
 * @param {*} options
 * @param {*} log
 */
const rp = async function(options, log) {
  const retries = options.retries || 3;
  const retryDelay = options.retryDelay || 2000;
  const errorAfterRetries = options.errorAfterRetries || false;

  if (!options.timeout) options.timeout = 5000;

  let attempts = 0;
  while (attempts < retries) {
    try {
      return await _rp(options);
    } catch (error) {
      attempts++;
      const details = error.response && error.response.body ? error.response.body : error;
      const level = attempts === 3 ? 'error' : 'warn';
      log[level](
        `attempt: ${attempts}`,
        'Response',
        JSON.stringify(details, null, 2),
        'Request',
        JSON.stringify(_.omit(error.options, 'auth'), null, 2)
      );
      await sleep(retryDelay);
      if (attempts >= retries && errorAfterRetries) throw error;
    }
  }
};

/**
 * removes properties from object.
 * @param {Object} obj
 * @param {Array.<string>} props properties to remove in array of strings.
 */

/**
 *
 * @param {*} obj
 * @param {*} props
 */
function omit(obj, props) {
  for (let index = 0; index < props.length; index++) {
    delete obj[props[index]];
  }
}

/**
 * builds xmapi query string from object using key/value pairs. Returns a string without leading ?
 * @param {*} object
 */

/**
 *
 * @param {*} object
 */
function queryString(object) {
  let res = '';

  if (object && typeof object === 'object') {
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        res += encodeURI(`&${key}=${object[key]}`);
      }
    }
  }
  return res;
}

/**
 * builds a list of request options for paginated results like getPeople.
 * @param {*} total
 * @param {*} auth
 * @param {*} uri
 * @param {*} method
 * @param {*} json
 * @param {number} pageSize Default: 100
 */

/**
 *
 * @param {*} total
 * @param {*} auth
 * @param {*} uri
 * @param {*} method
 * @param {*} json
 * @param {*} pageSize
 */
function requestList(total, auth, uri, method = 'GET', json = null, pageSize = 100) {
  const queue = [];
  for (let i = pageSize; i < total; i += pageSize) {
    queue.push({
      method,
      json,
      uri: uri + `&offset=${i}`,
      auth
    });
  }
  return queue;
}

/**
 *
 * @param {*} param0
 * @param {*} api
 * @param {*} id
 * @param {*} query
 * @param {*} label
 */
async function get({ baseUrl, limiter, auth, subdomain, log }, api, id, query = {}, label = '') {
  const uri = `${baseUrl}${api}${encodeURI(id)}?${queryString(query)}`;
  const options = { method: 'GET', uri, auth };
  log.info('XMAPI:', subdomain, label, 'Get', id);
  const body = await limiter.schedule(rp, options, log);
  log.info('XMAPI:', subdomain, label, 'Got', id);

  return JSON.parse(body);
}

/**
 * xmapi get many handler. handles requests where results are paginated.
 *
 * @param {*} env The xmtoolbox representation of an xMatters instance.ironment
 * @param {*} api
 * @param {*} query
 * @param {*} label
 */

/**
 *
 * @param {*} param0
 * @param {*} api
 * @param {*} query
 * @param {*} label
 */
async function getMany({ baseUrl, limiter, auth, subdomain, log }, api, query = {}, label = '') {
  let uri = `${baseUrl}${api}?${queryString(query)}`;
  const label2 = query ? JSON.stringify(query) : '';
  log.info('XMAPI:', subdomain, label, 'Get Many', label2);

  const options = { method: 'GET', uri, auth };

  const response = await limiter.schedule(rp, options, log);

  //TODO: REMOVE THIS WORKAROUND FOR SCENARIOS: https://xmexternal.zendesk.com/agent/tickets/152468
  if (!response) {
    return [];
  }

  const resBody = JSON.parse(response);
  let list = resBody.data;

  const queue = requestList(resBody.total, auth, uri); //queue request for records > 100

  await Promise.all(
    queue.map(async function(options) {
      console.log(options.uri);
      const { data } = JSON.parse(await limiter.schedule(rp, options, log));
      list = list.concat(data);
    })
  );

  log.info('XMAPI:', subdomain, label, `Got Many (${list.length})`, label2);
  return list;
}

/**
 * xmapi create handler.
 * @param {*} env The xmtoolbox representation of an xMatters instance.ironment
 * @param {*} api
 * @param {*} json
 * @param {*} label
 * @param {*} dropId
 */

/**
 *
 * @param {*} param0
 * @param {*} api
 * @param {*} json
 * @param {*} label
 * @param {*} dropId
 */
async function create({ baseUrl, limiter, auth, subdomain, log }, api, json, label = '', dropId = false) {
  const name = json.targetName || json.name || '';
  const uri = `${baseUrl}${api}`;
  if (dropId) {
    delete json.id;
  }
  const options = { method: 'POST', uri, auth, json };
  log.info('XMAPI:', subdomain, label, 'Create', name);

  const body = await limiter.schedule(rp, options, log);
  const id = body && body.id ? body.id : '';
  log.info('XMAPI:', subdomain, label, 'Created', name, 'id:', id);
  return body;
}

/**
 * xmapi delete handler
 * @param {*} env The xmtoolbox representation of an xMatters instance.ironment
 * @param {*} api
 * @param {*} id
 * @param {*} label
 */
/**
 *
 * @param {*} param0
 * @param {*} api
 * @param {*} id
 * @param {*} label
 */
async function _delete({ baseUrl, limiter, auth, subdomain, log }, api, id, label = '') {
  const uri = `${baseUrl}${api}${id}`;
  const options = { method: 'DELETE', uri, auth };
  log.info('XMAPI:', subdomain, label, 'Delete', 'id:', id);
  const body = await limiter.schedule(rp, options, log);
  log.info('XMAPI:', subdomain, label, 'Deleted', 'id:', id);
  return body;
}

/**
 * xmapi update handler
 * @param {} environment
 * @param {*} api
 * @param {*} json
 * @param {*} id
 * @param {*} label
 */

/**
 *
 * @param {*} param0
 * @param {*} api
 * @param {*} json
 * @param {*} id
 * @param {*} label
 */
async function update({ baseUrl, limiter, auth, subdomain, log }, api, json, id, label = '') {
  const name = json.targetName || json.name || '';
  const uri = `${baseUrl}${api}`;
  json.id = id;
  const options = { method: 'POST', uri, auth, json };
  log.info('XMAPI:', subdomain, label, 'Update', name, 'id:', id);
  const body = await limiter.schedule(rp, options, log);
  log.info('XMAPI:', subdomain, label, 'Updated', name, 'id:', id);
  return body;
}

/**
 *
 * @param {*} param0
 * @param {*} api
 * @param {*} formData
 * @param {*} label
 */
async function upload({ baseUrl, limiter, auth, subdomain, log }, api, formData, label = '') {
  const name = formData.targetName || formData.name || '';
  const uri = `${baseUrl}${api}`;
  const headers = { 'Content-Type': 'multipart/form-data' };
  const options = { method: 'POST', uri, auth, formData, headers };
  log.info('XMAPI:', subdomain, label, 'Upload', name);
  const body = await limiter.schedule(rp, options, log);
  log.info('XMAPI:', subdomain, label, 'Upload', name);
  return body;
}

/**
 * wrapper for request-promise
 * @param {} environment
 * @param {*} api
 * @param {*} query
 * @param {*} json
 * @param {*} label
 * @param {*} method
 * @p
 */
async function request({ baseUrl, limiter, auth, subdomain, log }, api, query, options, label = '') {
  let uri = `${baseUrl}${api}?${queryString(query)}`;
  options.uri = uri;
  options.auth = auth;
  log.info('XMAPI:', subdomain, label, options.method);
  const body = await limiter.schedule(rp, options, log);
  log.info('XMAPI:', subdomain, label, options.method);
  return body;
}

/**
 * simple sleep function to add delay where needed.
 * @param {*} ms
 */

/**
 *
 * @param {*} ms
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 *
 * @param {*} name
 * @param {*} sourceObjects
 * @param {*} destinationObjects
 * @param {*} destination
 * @param {*} syncField
 * @param {*} objectFields
 * @param {*} createFunction
 * @param {*} updateFunction
 * @param {*} deleteFunction
 * @param {*} options
 * @param {*} parentId
 */
async function syncObject(
  name,
  sourceObjects,
  destinationObjects,
  destination,
  syncField,
  objectFields,
  createFunction,
  updateFunction,
  deleteFunction,
  options = {},
  parentKey
) {
  if (!sourceObjects)
    destination.log.error(
      'SYNC:',
      `The sync is set to sync ${name}s but ${name}s were not included in the source data.`
    );

  const fields = options.fields || objectFields;
  const mirror = options.mirror || false;
  const delayRemoval = options.delayRemoval || true;
  const syncFields = Array.isArray(syncField) ? syncField : [syncField];

  const defaults = getNullDefaults(fields); //Create empty null object for synced fields to remove values from destination when not included in source.

  const pendingDelete = [];
  const deleted = [];
  const synced = await Promise.all(
    sourceObjects.map(async sourceObject => {
      //for objects that require parent references. Pull off the id of the parent from the source object.
      const parentId = sourceObject[parentKey];

      //loop for a match accorting to the synced fields.
      const matchTarget = _.pick(sourceObject, syncFields);
      const match = _.find(destinationObjects, matchTarget);

      if (match) {
        //if match update.
        const sourceObjectProps = _.pick(sourceObject, fields);
        const destObjectProps = _.pick(match, fields);
        if (_.isMatch(destObjectProps, sourceObjectProps)) {
          destination.log.info(`SYNC: Skip ${name} (match):`, match[syncFields[0]]);
          return match;
        } else {
          const update = _.defaults(sourceObjectProps, defaults);
          destination.log.info(`SYNC: Update ${name}:`, match[syncFields[0]]);
          if (typeof updateFunction === 'function') {
            return updateFunction(destination, update, match.id, parentId);
          } else {
            //if there is not an update function, delete then create to update
            destination.log.info(
              `SYNC: Remove ${name} and Add Updated:`,
              sourceObject[syncFields[0]],
              sourceObject.id
            );
            await deleteFunction(destination, match.id, parentId);
            return createFunction(destination, update, parentId);
          }
        }
      } else {
        //if not match create object
        destination.log.info(`SYNC: Create ${name}:`, sourceObject[syncFields[0]]);
        omit(sourceObject, 'links');
        return createFunction(destination, sourceObject, parentId);
      }
    })
  );

  //Mirror Mode: Delete ones found in destination not contained in source
  if (mirror) {
    await Promise.all(
      destinationObjects.map(async destinationObject => {
        const match = _.find(sourceObjects, _.pick(destinationObject, syncFields));
        if (!match) {
          destination.log.info(
            `SYNC: Remove ${name} (mirror mode):`,
            destinationObject[syncFields[0]],
            destinationObject.id
          );
          if (delayRemoval) {
            pendingDelete.push(destinationObject);
          } else if (typeof deleteFunction === 'function') {
            const parentId = destinationObject[parentKey];
            deleted.push(await deleteFunction(destination, destinationObject.id, parentId));
          }
        }
      })
    );
  }
  return { synced, remove: pendingDelete };
}

/**
 * Assist's with ExportToImport functions.
 * Accepts a data object's parent, all destination Parents and the field
 * they are matching on for the parent and update the  parent with
 * the id of the parent in the destination if it exists or
 *
 * @param {*} childsParent
 * @param {*} destinationParents
 * @param {*} matchField
 * @returns {string} child's parent id or matchField id if not availale.
 */
function AssignParentObject(childsParent, destinationParents, matchField) {
  if (childsParent) {
    //
    if (childsParent[matchField]) {
      childsParent = childsParent[matchField];
    }
    //attempt to find a matching group and use it's id
    if (destinationParents) {
      const destinationParent = destinationParents.find(parent => parent[matchField] === childsParent);
      if (destinationParent && destinationParent.id) childsParent = destinationParent.id;
    }
  }

  return childsParent;
}

/**
 *
 * @param {*} fields
 */
function getNullDefaults(fields) {
  return _(fields)
    .mapKeys()
    .mapValues(function() {
      return null;
    })
    .value();
}

exports.omit = omit;
exports.get = get;
exports.getMany = getMany;
exports.create = create;
exports.update = update;
exports.upload = upload;
exports.request = request;
exports.delete = _delete;
exports.syncObject = syncObject;
exports.AssignParentObject = AssignParentObject;