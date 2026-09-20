import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyLanguage, eventPresentation, getEventMessage, initialLanguage, routePresentation } from '../src/i18n'

const store = new Map<string, string>()
Object.assign(globalThis, { localStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) }, document: { documentElement: { lang: '' } } })
test('i18n defaults, persists, validates storage and updates html lang', () => {
  store.clear(); assert.equal(initialLanguage(), 'es'); applyLanguage('en'); assert.equal(store.get('metrofly-language'), 'en'); assert.equal((document as any).documentElement.lang, 'en'); assert.equal(initialLanguage(), 'en'); store.set('metrofly-language', 'fr'); assert.equal(initialLanguage(), 'es'); applyLanguage('es'); assert.equal((document as any).documentElement.lang, 'es')
})
test('i18n localizes event identity, E665 presentation, and Brain Report selection', () => {
  assert.equal(getEventMessage('es', 'STILL_WAITING', 0), 'Todavía esperando.'); assert.equal(getEventMessage('en', 'STILL_WAITING', 0), 'Still waiting.'); assert.match(routePresentation.es.e665.description, /Se sabe que existe/); assert.match(routePresentation.en.e665.description, /Allegedly real/); assert.equal(eventPresentation.en.CLASS_STARTED[0], 'Class has started.')
})
