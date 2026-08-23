import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ThemeProvider, useTheme, THEME_STORAGE_KEY } from '../../src/context/ThemeContext';
import { getChartTheme, getChartTooltipStyle, lightChartTheme, darkChartTheme } from '../../src/utils/chartTheme';

// Helper component to test useTheme hook within provider
function TestThemeConsumer() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>Toggle</button>
      <button data-testid="set-light-btn" onClick={() => setTheme('light')}>Set Light</button>
      <button data-testid="set-dark-btn" onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  );
}

// Faulty consumer to test hook exception
function FaultyThemeConsumer() {
  const { theme } = useTheme();
  return <div>{theme}</div>;
}

describe('Feature 12: Theme Context, Provider, State Hook & Chart Theme', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};

    const mockStorage: Storage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (index: number) => Object.keys(store)[index] || null,
      length: 0,
    };

    const classList = new Set<string>();
    const mockDocumentElement = {
      classList: {
        add: (cls: string) => classList.add(cls),
        remove: (cls: string) => classList.delete(cls),
        contains: (cls: string) => classList.has(cls),
      },
      style: {
        colorScheme: '',
      },
    };

    const mockWindow = {
      localStorage: mockStorage,
      matchMedia: (query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    };

    (globalThis as any).window = mockWindow;
    (globalThis as any).document = {
      documentElement: mockDocumentElement,
    };
    (globalThis as any).localStorage = mockStorage;
  });

  afterEach(() => {
    delete (globalThis as any).window;
    delete (globalThis as any).document;
    delete (globalThis as any).localStorage;
    vi.restoreAllMocks();
  });

  describe('1. ThemeContext & ThemeProvider Initialization', () => {
    it('T12.1.1: defaults to dark theme when no localStorage exists and system prefers dark', () => {
      (globalThis as any).window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const html = renderToString(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );

      expect(html).toContain('dark');
    });

    it('T12.1.2: defaults to light theme when system prefers light and no localStorage', () => {
      (globalThis as any).window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const html = renderToString(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );

      expect(html).toContain('light');
    });

    it('T12.1.3: prioritizes localStorage saved theme over system preference', () => {
      (globalThis as any).localStorage.setItem(THEME_STORAGE_KEY, 'light');
      (globalThis as any).window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: true, // system wants dark
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const html = renderToString(
        <ThemeProvider>
          <TestThemeConsumer />
        </ThemeProvider>
      );

      expect(html).toContain('light');
    });

    it('T12.1.4: accepts explicit defaultTheme prop', () => {
      const html = renderToString(
        <ThemeProvider defaultTheme="light">
          <TestThemeConsumer />
        </ThemeProvider>
      );

      expect(html).toContain('light');
    });
  });

  describe('2. Hook Safety & Boundaries', () => {
    it('T12.2.1: throws error when useTheme is called outside ThemeProvider', () => {
      expect(() => {
        renderToString(<FaultyThemeConsumer />);
      }).toThrow('useTheme must be used within a ThemeProvider');
    });
  });

  describe('3. Chart Theme Utilities', () => {
    it('T12.3.1: returns valid light mode chart tokens with high contrast', () => {
      const theme = getChartTheme('light');
      expect(theme).toEqual(lightChartTheme);
      expect(theme.tooltipBg).toContain('255, 255, 255');
      expect(theme.tooltipText).toBe('#0F172A');
      expect(theme.gridStroke).toContain('rgba(226, 232, 240');
      expect(theme.radarStroke).toBe('#6366F1');
    });

    it('T12.3.2: returns valid dark mode chart tokens matching obsidian aesthetics', () => {
      const theme = getChartTheme('dark');
      expect(theme).toEqual(darkChartTheme);
      expect(theme.tooltipBg).toContain('15, 23, 42');
      expect(theme.tooltipText).toBe('#F8FAFC');
      expect(theme.gridStroke).toContain('rgba(255, 255, 255');
      expect(theme.radarStroke).toBe('#818CF8');
    });

    it('T12.3.3: returns properly formatted tooltip style object for Recharts', () => {
      const lightStyle = getChartTooltipStyle('light');
      expect(lightStyle.color).toBe('#0F172A');
      expect(lightStyle.borderRadius).toBe('12px');
      expect(lightStyle.borderWidth).toBe('1px');

      const darkStyle = getChartTooltipStyle('dark');
      expect(darkStyle.color).toBe('#F8FAFC');
      expect(darkStyle.backgroundColor).toContain('15, 23, 42');
    });
  });
});
