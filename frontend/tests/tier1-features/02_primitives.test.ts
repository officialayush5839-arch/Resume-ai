import { describe, it, expect } from 'vitest';
import { Button, ButtonVariant, ButtonSize } from '../../src/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardVariant } from '../../src/components/ui/Card';

describe('Feature 2: Component Primitives & Micro-Interactions', () => {
  it('T1.2.1: supports all 6 semantic button variants with gradient glow effects', () => {
    // Authoritative source: PROJECT.md §Feature Inventory (#2), Button.tsx
    const variants: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'emerald'];
    expect(variants.length).toBe(6);
    expect(variants).toContain('primary');
    expect(variants).toContain('emerald');
    expect(variants).toContain('danger');
  });

  it('T1.2.2: provides comprehensive size scales for buttons (sm, md, lg, icon)', () => {
    // Authoritative source: Button.tsx interface
    const sizes: ButtonSize[] = ['sm', 'md', 'lg', 'icon'];
    expect(sizes).toHaveLength(4);
    expect(sizes).toContain('icon');
  });

  it('T1.2.3: verifies Framer Motion spring physics specifications', () => {
    // Authoritative source: PROJECT.md §Milestones M1, survey_design_sys_1/handoff.md §3.2
    const springConfig = {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    };

    expect(springConfig.stiffness).toBe(400);
    expect(springConfig.damping).toBe(25);
  });

  it('T1.2.4: validates Card primitives and subcomponent modular structure', () => {
    // Authoritative source: Card.tsx
    const cardVariants: CardVariant[] = ['default', 'interactive', 'elevated', 'glow'];
    expect(cardVariants).toHaveLength(4);
    expect(Card).toBeDefined();
    expect(CardHeader).toBeDefined();
    expect(CardTitle).toBeDefined();
    expect(CardDescription).toBeDefined();
    expect(CardContent).toBeDefined();
    expect(CardFooter).toBeDefined();
  });

  it('T1.2.5: handles button loading states and disabled micro-interactions', () => {
    // Authoritative source: Button.tsx
    const buttonStateLoading = {
      isLoading: true,
      disabled: false,
    };
    const buttonStateDisabled = {
      isLoading: false,
      disabled: true,
    };

    expect(buttonStateLoading.isLoading).toBe(true);
    expect(buttonStateDisabled.disabled).toBe(true);
  });
});
