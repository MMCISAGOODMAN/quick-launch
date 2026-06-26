/**
 * Quick Launch Plugin Example
 *
 * Plugins export `search` and `execute` functions.
 * Place your plugin in the plugins/ directory with a manifest.json.
 *
 * @see docs/plugin-development.md
 */

/** @typedef {import('../../src/types').SearchResult} SearchResult */

function init(api) {
  const count = parseInt(api.getData('runCount') || '0', 10)
  api.setData('runCount', String(count + 1))
}

/**
 * Search handler - called on every query
 * @param {string} query
 * @returns {SearchResult[]}
 */
function search(query) {
  const q = query.trim().toLowerCase()
  if (!q.startsWith('hello')) return []

  const name = q.replace(/^hello\s*/, '') || 'World'

  return [{
    id: `plugin:hello:${name}`,
    type: 'plugin',
    title: `Say Hello to ${name}`,
    subtitle: 'Example plugin action',
    score: 90,
    payload: { name },
  }]
}

/**
 * Execute handler - called when user selects a plugin result
 * @param {SearchResult} result
 */
function execute(result) {
  const name = result.payload.name || 'World'
  console.log(`Hello, ${name}!`)
}

module.exports = { init, search, execute }
