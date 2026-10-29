import assert from 'node:assert/strict';
import test from 'node:test';
import { responsiveLayout } from '../src/lib/responsive.ts';

test('mobile remains two columns, tablet has three, desktop has four', () => {
  assert.equal(responsiveLayout(393).isWide, false);
  assert.equal(responsiveLayout(767).columns, 2);
  assert.equal(responsiveLayout(768).columns, 3);
  assert.equal(responsiveLayout(1023).isDesktop, false);
  assert.equal(responsiveLayout(1024).columns, 4);
  assert.equal(responsiveLayout(0).cardWidth, 0);
});

test('card widths fit the padded content and remain capped on large monitors', () => {
  for (const width of [768, 820, 1024, 1440, 1920]) {
    const { columns, cardWidth } = responsiveLayout(width);
    assert.ok(Math.abs(columns * cardWidth + (columns - 1) * 14 - (Math.min(width, 1200) - 64)) < 0.01);
  }
  assert.equal(responsiveLayout(1440).cardWidth, responsiveLayout(1920).cardWidth);
});
