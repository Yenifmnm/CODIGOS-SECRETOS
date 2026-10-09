import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

function load(file, imports = {}, extra = '') {
  const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
  const code = ts.transpileModule(source + extra, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    if (name in imports) return imports[name];
    if (name === 'react') return React;
    if (name === 'react/jsx-runtime') return jsx;
    if (/\.(css|svg|png|webp)$/.test(name)) return { default: '/test-asset' };
    throw new Error('Unexpected import: ' + name);
  } });
  return exports;
}

const departments = load('src/app/departamentos.ts');
const { ParchmentSelect } = load('src/components/forms/ParchmentSelect.tsx');
const validForm = { fullName: 'Prueba Local', birthDate: '1990-01-01', cedula: '0000000',
  email: 'prueba@example.invalid', city: 'Central', phone: '000000000' };

function registration(storedCity) {
  const states = [], sent = [];
  const storedForm = storedCity === undefined ? null : { ...validForm, city: storedCity };
  const imports = {
    react: { useState: initial => {
      const index = states.length;
      states.push(typeof initial === 'function' ? initial() : initial);
      return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
    } },
    'react-router-dom': { useNavigate: () => () => {}, useLocation: () => ({ state: { cedula: '0000000' } }) },
    '../../app/departamentos': departments,
    '../../app/age': { MIN_AGE: 18, completedAge: () => 30, isOfAge: () => true, maxBirthDate: () => '2008-01-01' },
    '../../app/SessionContext': { useSession: () => ({ setParticipant() {} }) },
    '../../app/useCodeFlow': { useCodeFlow: () => ({ redeem() {}, error: null }) },
    '../../app/stage': { box: () => ({}), centeredText: () => ({}), u: value => value },
    '../../services/participantStorage': { readStoredParticipant: () => storedForm ? { form: storedForm } : null },
    '../../services/promoApi': { promoApi: { registerParticipant: async form => { sent.push(form); return { ok: true }; } } },
    '../../components/forms/ParchmentSelect': { ParchmentSelect },
  };
  for (const [path, name] of [
    ['layout/Stage', 'Stage'], ['layout/Deco', 'Deco'], ['buttons/RibbonButton', 'RibbonButton'],
    ['promo/RibbonPlate', 'RibbonPlate'], ['promo/RibbonSvg', 'RibbonSvg'],
    ['effects/FloatingLayer', 'FloatingLayer'], ['forms/ParchmentField', 'ParchmentField'],
  ]) imports['../../components/' + path] = { [name]: () => null };
  const module = load('src/pages/Register/Register.tsx', imports, '\nexport { validate };');
  const tree = module.default();
  return { states, sent, tree, validate: module.validate };
}

test('las 18 opciones coinciden exactamente con la lista solicitada, sin números', () => {
  assert.deepEqual(Array.from(departments.DEPARTAMENTOS), [
    'Asunción', 'Concepción', 'San Pedro', 'Cordillera', 'Guairá', 'Caaguazú', 'Caazapá',
    'Itapúa', 'Misiones', 'Paraguarí', 'Alto Paraná', 'Central', 'Ñeembucú', 'Amambay',
    'Canindeyú', 'Presidente Hayes', 'Boquerón', 'Alto Paraguay',
  ]);
});

test('selector nativo de una opción, etiqueta accesible y errores asociados', () => {
  const html = renderToStaticMarkup(React.createElement(ParchmentSelect, {
    id: 'departamento', label: 'Departamento', name: 'city', options: departments.DEPARTAMENTOS,
    value: 'Ñeembucú', onChange() {}, required: true, error: 'Error de prueba',
  }));
  assert.match(html, /<label[^>]*for="departamento"/);
  assert.match(html, /aria-describedby="departamento-error"/);
  assert.match(html, /<option value="Ñeembucú" selected="">Ñeembucú<\/option>/);
  assert.equal((html.match(/<option /g) ?? []).length, 19);
  assert.doesNotMatch(html, /multiple=|<input/);
});

test('registro exige elegir un departamento válido, sin números ni ciudades libres', () => {
  const { validate } = registration();
  for (const city of ['', 'Luque', '11', '11- Central']) {
    assert.equal(validate({ ...validForm, city }).city, 'Seleccioná tu departamento.');
  }
  for (const city of departments.DEPARTAMENTOS) assert.equal(validate({ ...validForm, city }).city, undefined);
});

test('registro guardado con ciudad antigua conserva los demás datos pero exige selección', () => {
  const h = registration('Luque');
  assert.equal(h.states[0].city, '');
  assert.equal(h.states[0].fullName, validForm.fullName);
  assert.equal(h.states[0].cedula, validForm.cedula);
  assert.equal(registration('Asunción').states[0].city, 'Asunción');
});

test('móvil y escritorio comparten el selector y actualizarlo conserva los otros campos', () => {
  const h = registration('Central');
  const field = h.tree.props.mobile.props.fields[4];
  assert.equal(field.type, ParchmentSelect);
  assert.equal(field.props.label, 'Departamento');
  assert.equal(field.props.autoComplete, 'address-level1');
  field.props.onChange({ target: { value: 'Presidente Hayes' } });
  assert.equal(h.states[0].city, 'Presidente Hayes');
  assert.equal(h.states[0].email, validForm.email);
  const desktop = h.tree.props.children.find(element => element?.type === 'form');
  assert.ok(desktop.props.children.some(element => element?.props?.children === field));
});

test('envío local conserva el nombre de departamento en city sin modificar el contrato', async () => {
  const h = registration('Alto Paraguay');
  await h.tree.props.mobile.props.onSubmit({ preventDefault() {} });
  assert.equal(h.sent.length, 1);
  assert.equal(h.sent[0].city, 'Alto Paraguay');
  assert.equal(h.sent[0].email, validForm.email);
});
