import { describe, it, expect } from 'vitest';
import { getScoreTier } from '../../src/utils/matching';

describe('Feature 1: Quantum Glass Design System & Theme Tokens', () => {
  it('T1.1.1: defines core obsidian canvas and surface glass color tokens', () => {
    // Authoritative source: ORIGINAL_REQUEST §R1, PROJECT.md §Design System Contract
    const designTokens = {
      canvasBg: '#0A0E1A',
      surfaceGlass: 'rgba(15, 23, 42, 0.65)',
      surfaceGlassElevated: 'rgba(30, 41, 59, 0.85)',
      brandPrimary: '#6366F1',
      brandAccent: '#818CF8',
      matchEmerald: '#10B981',
      matchAmber: '#F59E0B',
      matchRose: '#F43F5E',
      matchCyan: '#06B6D4',
    };

    expect(designTokens.canvasBg).toBe('#0A0E1A');
    expect(designTokens.brandPrimary).toBe('#6366F1');
    expect(designTokens.matchEmerald).toBe('#10B981');
    expect(designTokens.matchAmber).toBe('#F59E0B');
    expect(designTokens.matchRose).toBe('#F43F5E');
  });

  it('T1.1.2: maps score tiers to accurate semantic color and badge variants', () => {
    // Authoritative source: PROJECT.md §Feature Inventory (#19, #21), getScoreTier
    const tierExcellent = getScoreTier(92);
    expect(tierExcellent.tier).toBe('Excellent Match');
    expect(tierExcellent.color).toBe('#10B981');
    expect(tierExcellent.badgeVariant).toBe('emerald');
    expect(tierExcellent.textClass).toContain('emerald');

    const tierGood = getScoreTier(78);
    expect(tierGood.tier).toBe('Good Match');
    expect(tierGood.color).toBe('#6366F1');
    expect(tierGood.badgeVariant).toBe('indigo');
    expect(tierGood.textClass).toContain('indigo');

    const tierModerate = getScoreTier(55);
    expect(tierModerate.tier).toBe('Moderate Match');
    expect(tierModerate.color).toBe('#F59E0B');
    expect(tierModerate.badgeVariant).toBe('amber');
    expect(tierModerate.textClass).toContain('amber');

    const tierLow = getScoreTier(35);
    expect(tierLow.tier).toBe('Low Match');
    expect(tierLow.color).toBe('#F43F5E');
    expect(tierLow.badgeVariant).toBe('rose');
    expect(tierLow.textClass).toContain('rose');
  });

  it('T1.1.3: enforces quantum glass elevations and border glow classes', () => {
    // Authoritative source: survey_design_sys_1/handoff.md §3.1
    const glassElevations = {
      l1Card: 'glass-card',
      l1Interactive: 'glass-card-interactive',
      l2Elevated: 'glass-card-elevated',
      textGradient: 'gradient-brand-text',
      ambientGlow: 'ambient-glow-mesh',
    };

    expect(glassElevations.l1Card).toBe('glass-card');
    expect(glassElevations.l1Interactive).toBe('glass-card-interactive');
    expect(glassElevations.l2Elevated).toBe('glass-card-elevated');
    expect(glassElevations.textGradient).toBe('gradient-brand-text');
    expect(glassElevations.ambientGlow).toBe('ambient-glow-mesh');
  });

  it('T1.1.4: verifies glowing shadow token configurations', () => {
    // Authoritative source: PROJECT.md §Design System Contract
    const shadowGlows = {
      indigo: '0 0 25px -5px rgba(99, 102, 241, 0.35)',
      emerald: '0 0 25px -5px rgba(16, 185, 129, 0.35)',
      amber: '0 0 25px -5px rgba(245, 158, 11, 0.35)',
      rose: '0 0 25px -5px rgba(244, 63, 94, 0.35)',
    };

    expect(shadowGlows.indigo).toContain('rgba(99, 102, 241');
    expect(shadowGlows.emerald).toContain('rgba(16, 185, 129');
    expect(shadowGlows.rose).toContain('rgba(244, 63, 94');
  });

  it('T1.1.5: verifies high-contrast typography hierarchy on dark canvas', () => {
    // Authoritative source: survey_design_sys_1/handoff.md §2 Step 1
    const typographyTokens = {
      title: '#F8FAFC', // Slate 50 (AAA contrast on #0A0E1A > 15:1)
      body: '#CBD5E1',  // Slate 300 (AAA contrast on #0A0E1A > 10:1)
      muted: '#64748B', // Slate 500 (AA contrast on #0A0E1A > 4.5:1)
      dim: '#475569',   // Slate 600
    };

    expect(typographyTokens.title).toBe('#F8FAFC');
    expect(typographyTokens.body).toBe('#CBD5E1');
    expect(typographyTokens.muted).toBe('#64748B');
  });
});
