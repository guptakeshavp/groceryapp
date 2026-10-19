import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RuleListParser } from '../src/core/list-parser.ts';
import { catalogue } from './fixtures/household.ts';

const PASTE = `Bhai, order kar de:
amul ghee 1 litre
amul butter 500g
aashirvaad atta 5kg
maggi 1 packet (280g wala)
surf excel matic top load 5kg
pyaaz 1 kg
tata salt`;

test('reads the family\'s Hinglish WhatsApp list into Items and quantities', async () => {
  const lines = await new RuleListParser().parse(PASTE, [...catalogue().values()]);
  assert.deepEqual(
    lines.map((l) => [l.itemId ?? `NEW:${l.text}`, l.quantity && `${l.quantity.amount}${l.quantity.unit}`]),
    [
      ['ghee', '1000ml'],
      ['butter', '500g'],
      ['atta', '5000g'],
      ['maggi', '280g'],
      ['surf', '5000g'],
      ['onion', '1000g'],
      ['NEW:tata salt', undefined],
    ],
  );
});
