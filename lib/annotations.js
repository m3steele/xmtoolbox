const common = require('./common');

/**
 * @module annotations
 */

/**
 *
 * @param {*} env The xmtoolbox representation of an xMatters instance.
 * @param {*} annotationId
 * @param {*} query
 * @param {*} eventId
 */
async function get(env, annotationId, query, eventId) {
  return common.get(env, `/api/xm/1/events/${eventId}/annotations/`, annotationId, query, `Annotation`);
}

/**
 *
 * @param {*} env The xmtoolbox representation of an xMatters instance.
 * @param {*} query
 * @param {*} eventId
 */
async function getMany(env, query, eventId) {
  return common.getMany(env, `/api/xm/1/events/${eventId}/annotations`, query, `Annotations`);
}

/**
 *
 * @param {*} env The xmtoolbox representation of an xMatters instance.
 * @param {*} annotation
 * @param {*} eventId
 */
async function create(env, annotation, eventId) {
  return common.create(env, `/api/xm/1/events/${eventId}/annotations`, annotation, 'Annotation', true);
}

exports.get = get;
exports.getMany = getMany;
exports.create = create;