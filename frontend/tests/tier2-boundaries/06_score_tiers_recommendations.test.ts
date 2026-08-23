import { describe, it, expect } from 'vitest';
import { getScoreTier } from '../../src/utils/matching';

describe('Tier 2 Boundary: Score Tiers & Recommendation Thresholds', () => {
  it('T2.6.1: exact boundary score 85.0% maps to Excellent Match', () => {
    // Authoritative source: TEST_INFRA §Coverage Thresholds, getScoreTier
    const tier = getScoreTier(85.0);
    expect(tier.tier).toBe('Excellent Match');
    expect(tier.color).toBe('#10B981');
    expect(tier.badgeVariant).toBe('emerald');
  });

  it('T2.6.2: exact boundary score 84.9% maps to Good Match', () => {
    const tier = getScoreTier(84.9);
    expect(tier.tier).toBe('Good Match');
    expect(tier.color).toBe('#6366F1');
    expect(tier.badgeVariant).toBe('indigo');
  });

  it('T2.6.3: exact boundary score 70.0% maps to Good Match', () => {
    const tier = getScoreTier(70.0);
    expect(tier.tier).toBe('Good Match');
    expect(tier.color).toBe('#6366F1');
  });

  it('T2.6.4: exact boundary score 69.9% maps to Moderate Match', () => {
    const tier = getScoreTier(69.9);
    expect(tier.tier).toBe('Moderate Match');
    expect(tier.color).toBe('#F59E0B');
    expect(tier.badgeVariant).toBe('amber');
  });

  it('T2.6.5: exact boundary score 50.0% maps to Moderate Match', () => {
    const tier = getScoreTier(50.0);
    expect(tier.tier).toBe('Moderate Match');
    expect(tier.color).toBe('#F59E0B');
  });

  it('T2.6.6: exact boundary score 49.9% maps to Low Match', () => {
    const tier = getScoreTier(49.9);
    expect(tier.tier).toBe('Low Match');
    expect(tier.color).toBe('#F43F5E');
    expect(tier.badgeVariant).toBe('rose');
  });

  it('T2.6.7: exact boundary score 0.0% maps to Low Match', () => {
    const tier = getScoreTier(0.0);
    expect(tier.tier).toBe('Low Match');
    expect(tier.color).toBe('#F43F5E');
  });

  it('T2.6.8: exact boundary score 100.0% maps to Excellent Match', () => {
    const tier = getScoreTier(100.0);
    expect(tier.tier).toBe('Excellent Match');
    expect(tier.color).toBe('#10B981');
  });

  it('T2.6.9: handles negative inputs by safely mapping to Low Match', () => {
    const tier = getScoreTier(-10.5);
    expect(tier.tier).toBe('Low Match');
    expect(tier.color).toBe('#F43F5E');
  });

  it('T2.6.10: handles out-of-bound >100 score by mapping to Excellent Match', () => {
    const tier = getScoreTier(125.0);
    expect(tier.tier).toBe('Excellent Match');
    expect(tier.color).toBe('#10B981');
  });
});
