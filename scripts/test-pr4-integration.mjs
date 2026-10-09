import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

const source = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
function load(file, imports = {}, globals = {}, env = {}) {
  const raw = source(file).replaceAll('import.meta.env', JSON.stringify(env));
  const code = ts.transpileModule(raw, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, Error, console: { error() {}, warn() {} }, ...globals,
    require(name) {
      if (name in imports) return imports[name];
      if (/\.(png|webp|css)$/.test(name)) return { default: '/test-asset' };
      throw new Error('Unexpected import ' + name);
    },
  });
  return exports;
}
const contract = load('src/services/respuestaCanje.ts');
const form = { cedula: 'TEST-ID', fullName: 'Prueba Local', phone: 'TEST-PHONE',
  email: 'test@example.invalid', birthDate: '1990-01-01', city: 'Prueba' };
function adapter(reply, status = 200) {
  const requests = [];
  let stored = { form, codeCount: 4 };
  const apiModule = load('src/services/httpPromoApi.ts', {
    './respuestaCanje': contract,
    '../mocks/prizes': { MOCK_PRIZES: [], prizeByAvimovilId: () => undefined },
    '../mocks/terms': { getTermsText: () => '' },
    '../app/age': { MIN_AGE: 18, isOfAge: () => true },
    './participantStorage': {
      readStoredParticipant: () => stored,
      saveStoredParticipant: (f, count) => { stored = { form: f, codeCount: count }; },
      toParticipant: f => f,
    },
  }, { fetch: async (url, options) => {
    requests.push({ url, ...options, body: JSON.parse(options.body) });
    return { ok: status >= 200 && status < 300, status, json: async () => {
      if (reply instanceof Error) throw reply;
      return reply;
    } };
  } });
  return { api: new apiModule.HttpPromoApi('https://backend.example.invalid/purosol/'),
    requests, BotCheckRejectedError: apiModule.BotCheckRejectedError };
}
const input = { cedula: 'TEST-ID', code: 'TEST-CODE', turnstileToken: 'TEST-TOKEN' };

test('V2 sends Turnstile, code and registration; preserves raw winner and coupons', async () => {
  const a = adapter({ shortMessage: 'PREMIO-8-NINTENDO', coupons: 7 });
  const result = await a.api.submitPromoCode(input);
  assert.equal(result.status, 'WIN');
  assert.equal(result.prize.id, '8');
  assert.equal(result.codeCount, 7);
  assert.equal(a.requests.length, 1);
  assert.equal(a.requests[0].url, 'https://backend.example.invalid/purosol/api/v2/codes/redeem');
  assert.equal(a.requests[0].body.turnstileToken, 'TEST-TOKEN');
  assert.equal(a.requests[0].body.nombre, form.fullName);
  assert.equal(a.requests[0].body.code, input.code);
  assert.ok(!('recaptchaToken' in a.requests[0].body));
});

test('V2 normalized contract still works', async () => {
  const a = adapter({ status: 'WIN', prize: { id: '8', name: 'NINTENDO' }, codeCount: 9 });
  assert.equal((await a.api.submitPromoCode(input)).codeCount, 9);
});

for (const [message, expected] of [
  ['invalido', 'CODE_NOT_FOUND'], ['repetido', 'CODE_ALREADY_USED'],
  ['participacion', 'LOSE'], ['limite', 'RATE_LIMITED'],
]) test('keeps outcome and coupon count: ' + message, async () => {
  const a = adapter({ shortMessage: message, coupons: 12 });
  const result = await a.api.submitPromoCode(input);
  assert.equal(result.status, expected);
  assert.equal(result.codeCount, 12);
});

test('rejects unresolved prizes, conflicting contracts and invalid quantities', async () => {
  for (const reply of [
    { shortMessage: 'premio-[variables!INSTANT_WIN_PRIZE]', coupons: 1 },
    { shortMessage: 'participacion', status: 'WIN', prize: { id: '8', name: 'Nintendo' } },
    { shortMessage: 'participacion', coupons: -1 },
    { shortMessage: 'error', coupons: 1 },
  ]) await assert.rejects(adapter(reply).api.submitPromoCode(input), contract.ErrorCanje);
});

test('403 stays security error; 429, 502 and malformed JSON retain diagnostics', async () => {
  const forbidden = adapter({}, 403);
  await assert.rejects(forbidden.api.submitPromoCode(input), forbidden.BotCheckRejectedError);
  for (const [status, tipo] of [[429, 'limite-http'], [502, 'http']]) {
    await assert.rejects(adapter({}, status).api.submitPromoCode(input), e => e.tipo === tipo);
  }
  await assert.rejects(adapter(new Error('bad JSON')).api.submitPromoCode(input),
    e => e.tipo === 'respuesta-ilegible');
});

test('winner notice exact in desktop and mobile; other results unchanged', () => {
  const Layout = load('src/components/promo/ResultLayout.tsx', {
    react: { ...React, useLayoutEffect() {} },
    'react/jsx-runtime': jsx,
    'react-router-dom': { useNavigate: () => () => {} },
    '../layout/Stage': { Stage: ({ mobile, children }) => React.createElement('div', null,
      React.createElement('section', { id: 'mobile' }, mobile),
      React.createElement('section', { id: 'desktop' }, children)) },
    '../layout/Deco': { Deco: () => null },
    '../../app/stage': { box: () => ({}), centeredText: () => ({}), u: x => x },
    '../buttons/PromoButton': { PromoButton: ({ children }) => React.createElement('button', null, children) },
    '../navigation/CloseButton': { CloseButton: () => null },
    './CodeCounter': { CodeCounter: () => null },
    './LogoCodigos': { LogoCodigos: () => null },
  }).ResultLayout;
  const base = { title: 'Resultado', message: ['Premio'], codeCount: 7, code: 'TEST',
    scene: null, mobileScene: null, pageTitle: 'Resultado' };
  const won = renderToStaticMarkup(React.createElement(Layout, { ...base, muestraTelefono: true }));
  assert.equal(won.split('*GUARDÁ TUS STICKERS GANADORES PARA CANJEAR TU PREMIO*').length - 1, 2);
  assert.equal(won.split('¡COMUNICATE AL +595 984 324 335 PARA RETIRARLO!').length - 1, 2);
  assert.ok(!won.includes('SEGUÍ CARGANDO'));
  const other = renderToStaticMarkup(React.createElement(Layout, base));
  assert.equal(other.split('¡SEGUÍ CARGANDO CÓDIGOS').length - 1, 2);
  assert.ok(!other.includes('COMUNICATE'));
  assert.ok(!other.includes('STICKERS GANADORES'));
});

function turnstileHarness(enabled = true) {
  let options, response = '', resets = 0;
  const timers = new Map();
  let timerId = 0;
  const fakeWindow = {
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    turnstile: {
      render(_el, opts) { options = opts; return 'widget'; },
      getResponse() { return response; }, isExpired() { return false; },
      reset() { response = ''; resets++; }, remove() {},
    },
  };
  const api = load('src/services/turnstile.ts', {}, { window: fakeWindow },
    { VITE_TURNSTILE_SITE_KEY: enabled ? 'TEST-ONLY' : '' });
  return { api, emit(value) { response = value; options.callback(value); },
    get options() { return options; }, get resets() { return resets; },
    expireWait() { for (const fn of [...timers.values()]) fn(); } };
}
test('Turnstile consumes each token once and lazily resets after a result', async () => {
  const h = turnstileHarness();
  h.api.mountTurnstile({ isConnected: true });
  await Promise.resolve(); await Promise.resolve();
  h.emit('first');
  assert.equal(await h.api.getTurnstileToken(), 'first');
  const second = h.api.getTurnstileToken();
  assert.equal(h.resets, 1);
  h.emit('second');
  assert.equal(await second, 'second');
  h.api.unmountTurnstile();
});
test('Turnstile timeout, fatal hostname and mock return no token', async () => {
  assert.equal(await turnstileHarness(false).api.getTurnstileToken(), undefined);
  const h = turnstileHarness();
  h.api.mountTurnstile({ isConnected: true });
  await Promise.resolve(); await Promise.resolve();
  const waiting = h.api.getTurnstileToken();
  h.expireWait();
  assert.equal(await waiting, undefined);
  h.options['error-callback']('110200');
  assert.equal(await h.api.getTurnstileToken(), undefined);
  h.api.unmountTurnstile();
});

test('Docker and Compose require new key and keep delivery runtime protections', () => {
  const docker = source('Dockerfile');
  const compose = source('compose.yaml');
  assert.match(docker, /ARG VITE_TURNSTILE_SITE_KEY/);
  assert.match(docker, /nginx-unprivileged/);
  assert.match(docker, /HEALTHCHECK/);
  assert.match(compose, /VITE_TURNSTILE_SITE_KEY:.*\?/);
  assert.match(compose, /127\.0\.0\.1:/);
  assert.match(compose, /read_only: true/);
  assert.ok(!compose.includes('VITE_RECAPTCHA_SITE_KEY'));
});

function flowHarness({ token = 'TEST-TOKEN', outcome = { status: 'LOSE', code: 'TEST', codeCount: 2 } } = {}) {
  const sent = [], states = [], results = [], routes = [];
  let resets = 0;
  class BotCheckRejectedError extends Error {}
  const flow = load('src/app/useCodeFlow.ts', {
    react: {
      useCallback: fn => fn, useRef: value => ({ current: value }),
      useState: value => [value, next => states.push(next)],
    },
    'react-router-dom': { useNavigate: () => (route) => routes.push(route) },
    '../services/promoApi': { promoApi: {
      checkParticipant: async () => ({ registered: true, participant: form }),
      submitPromoCode: async value => {
        sent.push(value);
        if (outcome === '403') throw new BotCheckRejectedError();
        return outcome;
      },
    } },
    '../services/turnstile': {
      isTurnstileEnabled: () => true, getTurnstileToken: async () => token,
      resetTurnstile: () => resets++,
    },
    '../services/httpPromoApi': { BotCheckRejectedError },
    './SessionContext': { useSession: () => ({
      setParticipant() {}, setLastResult: result => results.push(result),
    }) },
  }).useCodeFlow();
  return { flow, sent, states, results, routes, get resets() { return resets; } };
}
test('without Turnstile token no API request leaves the flow', async () => {
  const h = flowHarness({ token: null });
  await h.flow.redeem('TEST-ID', 'TEST-CODE');
  assert.equal(h.sent.length, 0);
  assert.equal(h.routes.length, 0);
  assert.ok(h.states.includes('No pasó la verificación de seguridad. Probá de nuevo en un momento.'));
  assert.equal(h.resets, 1);
});
test('double submit consumes only one token/request and keeps result cleanup', async () => {
  const h = flowHarness();
  await Promise.all([h.flow.submit('TEST-ID', 'TEST-CODE'), h.flow.submit('TEST-ID', 'TEST-CODE')]);
  assert.equal(h.sent.length, 1);
  assert.deepEqual(h.routes, ['/perdiste']);
  assert.equal(h.resets, 0);
  assert.equal(h.results[0], null);
  assert.equal(h.results.at(-1).status, 'LOSE');
});
test('backend 403 stays on form, resets token and shows security message', async () => {
  const h = flowHarness({ outcome: '403' });
  await h.flow.redeem('TEST-ID', 'TEST-CODE');
  assert.equal(h.sent.length, 1);
  assert.equal(h.routes.length, 0);
  assert.equal(h.resets, 1);
  assert.ok(h.states.includes('No pasó la verificación de seguridad. Probá de nuevo en un momento.'));
});
