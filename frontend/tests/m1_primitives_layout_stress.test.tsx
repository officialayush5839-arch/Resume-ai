import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

// UI Primitives
import { Button, ButtonVariant, ButtonSize } from '../src/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardVariant } from '../src/components/ui/Card';
import { Badge, BadgeVariant, BadgeSize } from '../src/components/ui/Badge';
import { Modal, ModalSize } from '../src/components/ui/Modal';
import { Input, Textarea } from '../src/components/ui/Input';
import { Tabs, TabItem } from '../src/components/ui/Tabs';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonStatCard } from '../src/components/ui/Skeleton';

// Layout Components
import Sidebar, { navItems } from '../src/components/layout/Sidebar';
import Topbar from '../src/components/layout/Topbar';
import { MobileNav } from '../src/components/layout/MobileNav';
import { LayoutShell } from '../src/components/layout/LayoutShell';
import { AmbientGlow } from '../src/components/layout/AmbientGlow';

// Icons & Utils
import { LinkedinIcon, GithubIcon, TwitterIcon, PortfolioIcon, SparklesIcon, BrainCircuitIcon, PulseDot } from '../src/utils/icons';

describe('Milestone 1 Empirical Stress Test: UI Primitives & Layout Shell', () => {

  describe('1. Button Primitive Stress Suite', () => {
    const variants: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'emerald'];
    const sizes: ButtonSize[] = ['sm', 'md', 'lg', 'icon'];

    it('renders all 6 variants with appropriate styling classes', () => {
      variants.forEach((variant) => {
        const html = renderToString(<Button variant={variant}>Click Me</Button>);
        expect(html).toContain('Click Me');
        expect(html).toContain('inline-flex items-center justify-center font-medium rounded-xl');
        if (variant === 'primary') expect(html).toContain('bg-gradient-to-r from-indigo-500');
        if (variant === 'emerald') expect(html).toContain('from-emerald-500');
        if (variant === 'danger') expect(html).toContain('bg-rose-500/20');
        if (variant === 'outline') expect(html).toContain('border border-indigo-500/40');
        if (variant === 'secondary') expect(html).toContain('bg-slate-800/80');
        if (variant === 'ghost') expect(html).toContain('text-slate-300 hover:bg-white/5');
      });
    });

    it('renders all 4 sizes correctly', () => {
      sizes.forEach((size) => {
        const html = renderToString(<Button size={size}>Button</Button>);
        if (size === 'sm') expect(html).toContain('px-3 py-1.5');
        if (size === 'md') expect(html).toContain('px-4 py-2');
        if (size === 'lg') expect(html).toContain('px-6 py-3');
        if (size === 'icon') expect(html).toContain('p-2');
      });
    });

    it('handles isLoading state: shows spinner, suppresses icons, applies disabled attribute', () => {
      const html = renderToString(
        <Button
          isLoading={true}
          leftIcon={<span data-testid="left-icon">L</span>}
          rightIcon={<span data-testid="right-icon">R</span>}
        >
          Submitting
        </Button>
      );
      expect(html).toContain('animate-spin');
      expect(html).toContain('disabled=""');
      expect(html).toContain('Submitting');
      expect(html).not.toContain('data-testid="left-icon"');
      expect(html).not.toContain('data-testid="right-icon"');
    });

    it('renders left and right icons when not loading', () => {
      const html = renderToString(
        <Button
          isLoading={false}
          leftIcon={<span className="left-icon-marker">L</span>}
          rightIcon={<span className="right-icon-marker">R</span>}
        >
          Action
        </Button>
      );
      expect(html).toContain('left-icon-marker');
      expect(html).toContain('right-icon-marker');
      expect(html).toContain('Action');
    });

    it('supports fullWidth prop and extra className customization', () => {
      const html = renderToString(<Button fullWidth className="custom-test-class">Full</Button>);
      expect(html).toContain('w-full');
      expect(html).toContain('custom-test-class');
    });

    it('handles extreme long text content safely without crashing', () => {
      const longText = 'A'.repeat(500);
      const html = renderToString(<Button>{longText}</Button>);
      expect(html).toContain(longText);
    });

    it('handles empty children or null children gracefully', () => {
      const htmlEmpty = renderToString(<Button />);
      expect(htmlEmpty).toContain('<button');
      const htmlNull = renderToString(<Button>{null}</Button>);
      expect(htmlNull).toContain('<button');
    });
  });

  describe('2. Card Primitive Stress Suite', () => {
    const cardVariants: CardVariant[] = ['default', 'interactive', 'elevated', 'glow'];

    it('renders all 4 card variants', () => {
      cardVariants.forEach((variant) => {
        const html = renderToString(<Card variant={variant}>Content</Card>);
        expect(html).toContain('Content');
        if (variant === 'default') expect(html).toContain('glass-card');
        if (variant === 'interactive') expect(html).toContain('glass-card-interactive');
        if (variant === 'elevated') expect(html).toContain('glass-card-elevated');
        if (variant === 'glow') expect(html).toContain('relative overflow-hidden');
      });
    });

    it('renders glow variants with all color palettes', () => {
      const colors: ('indigo' | 'emerald' | 'amber' | 'rose' | 'cyan')[] = ['indigo', 'emerald', 'amber', 'rose', 'cyan'];
      colors.forEach((glowColor) => {
        const html = renderToString(<Card variant="glow" glowColor={glowColor}>Glow Card</Card>);
        expect(html).toContain('blur-2xl');
        if (glowColor === 'indigo') expect(html).toContain('from-indigo-500/10');
        if (glowColor === 'emerald') expect(html).toContain('from-emerald-500/10');
        if (glowColor === 'amber') expect(html).toContain('from-amber-500/10');
        if (glowColor === 'rose') expect(html).toContain('from-rose-500/10');
        if (glowColor === 'cyan') expect(html).toContain('from-cyan-500/10');
      });
    });

    it('renders all Card subcomponents in hierarchical composition', () => {
      const html = renderToString(
        <Card variant="elevated">
          <CardHeader className="header-custom">
            <CardTitle className="title-custom">Candidate Analytics</CardTitle>
            <CardDescription className="desc-custom">Real-time matching score breakdown</CardDescription>
          </CardHeader>
          <CardContent className="content-custom">
            <p>Body Content</p>
          </CardContent>
          <CardFooter className="footer-custom">
            <span>Status: Verified</span>
          </CardFooter>
        </Card>
      );

      expect(html).toContain('header-custom');
      expect(html).toContain('Candidate Analytics');
      expect(html).toContain('Real-time matching score breakdown');
      expect(html).toContain('Body Content');
      expect(html).toContain('Status: Verified');
      expect(html).toContain('border-t border-white/5');
    });

    it('handles empty Card without breaking', () => {
      const html = renderToString(<Card />);
      expect(html).toContain('glass-card');
    });
  });

  describe('3. Badge Primitive Stress Suite', () => {
    const variants: BadgeVariant[] = ['indigo', 'emerald', 'amber', 'rose', 'cyan', 'purple', 'slate'];
    const sizes: BadgeSize[] = ['sm', 'md', 'lg'];

    it('renders all 7 semantic badge variants', () => {
      variants.forEach((variant) => {
        const html = renderToString(<Badge variant={variant}>React</Badge>);
        expect(html).toContain('React');
        expect(html).toContain('rounded-full border backdrop-blur-md');
        if (variant === 'indigo') expect(html).toContain('bg-indigo-500/10');
        if (variant === 'emerald') expect(html).toContain('bg-emerald-500/10');
        if (variant === 'amber') expect(html).toContain('bg-amber-500/10');
        if (variant === 'rose') expect(html).toContain('bg-rose-500/10');
        if (variant === 'cyan') expect(html).toContain('bg-cyan-500/10');
        if (variant === 'purple') expect(html).toContain('bg-purple-500/10');
        if (variant === 'slate') expect(html).toContain('bg-slate-800/60');
      });
    });

    it('renders all 3 badge sizes', () => {
      sizes.forEach((size) => {
        const html = renderToString(<Badge size={size}>SizeTest</Badge>);
        if (size === 'sm') expect(html).toContain('text-[11px] px-2 py-0.5');
        if (size === 'md') expect(html).toContain('text-xs px-2.5 py-1');
        if (size === 'lg') expect(html).toContain('text-sm px-3.5 py-1.5');
      });
    });

    it('renders static and pulsing dots correctly', () => {
      const htmlDot = renderToString(<Badge dot={true} pulse={false}>Online</Badge>);
      expect(htmlDot).toContain('relative flex h-2 w-2');
      expect(htmlDot).not.toContain('animate-ping');

      const htmlPulse = renderToString(<Badge dot={true} pulse={true}>Live Stream</Badge>);
      expect(htmlPulse).toContain('animate-ping');
      expect(htmlPulse).toContain('Live Stream');
    });

    it('renders remove button when onRemove callback is provided', () => {
      const onRemoveStub = () => {};
      const html = renderToString(<Badge onRemove={onRemoveStub}>Removable Skill</Badge>);
      expect(html).toContain('aria-label="Remove"');
      expect(html).toContain('<button');
    });

    it('renders custom icon slot', () => {
      const html = renderToString(
        <Badge icon={<span className="badge-custom-icon">★</span>}>Starred</Badge>
      );
      expect(html).toContain('badge-custom-icon');
      expect(html).toContain('Starred');
    });
  });

  describe('4. Modal Primitive Stress Suite', () => {
    const modalSizes: ModalSize[] = ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', 'full'];

    it('renders nothing when isOpen is false', () => {
      const html = renderToString(
        <Modal isOpen={false} onClose={() => {}}>
          <p>Hidden Content</p>
        </Modal>
      );
      expect(html).toBe('');
    });

    it('renders modal dialog and backdrop when isOpen is true', () => {
      const html = renderToString(
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="Candidate Profile Comparison"
          subtitle="Side-by-side competency radar and skill overlap"
          footer={<button>Confirm</button>}
        >
          <p>Comparison Body</p>
        </Modal>
      );

      expect(html).toContain('Candidate Profile Comparison');
      expect(html).toContain('Side-by-side competency radar');
      expect(html).toContain('Comparison Body');
      expect(html).toContain('Confirm');
      expect(html).toContain('bg-black/80 backdrop-blur-md');
      expect(html).toContain('glass-card-elevated');
      expect(html).toContain('aria-label="Close modal"');
    });

    it('renders across all responsive modal size constraints', () => {
      modalSizes.forEach((size) => {
        const html = renderToString(
          <Modal isOpen={true} onClose={() => {}} size={size}>
            <p>Size {size}</p>
          </Modal>
        );
        if (size === 'sm') expect(html).toContain('max-w-sm');
        if (size === 'md') expect(html).toContain('max-w-md');
        if (size === 'lg') expect(html).toContain('max-w-lg');
        if (size === 'xl') expect(html).toContain('max-w-xl');
        if (size === '2xl') expect(html).toContain('max-w-2xl');
        if (size === '3xl') expect(html).toContain('max-w-3xl');
        if (size === '4xl') expect(html).toContain('max-w-4xl');
        if (size === '5xl') expect(html).toContain('max-w-5xl');
        if (size === 'full') expect(html).toContain('max-w-[95vw]');
      });
    });

    it('honors showCloseButton={false}', () => {
      const html = renderToString(
        <Modal isOpen={true} onClose={() => {}} showCloseButton={false} title="No Close">
          <p>Body</p>
        </Modal>
      );
      expect(html).not.toContain('aria-label="Close modal"');
    });
  });

  describe('5. Input & Textarea Primitive Stress Suite', () => {
    it('renders Input with label, placeholder, and automatic id slugification', () => {
      const html = renderToString(
        <Input label="Job Title" placeholder="e.g. Senior Frontend Architect" />
      );
      expect(html).toContain('Job Title');
      expect(html).toContain('uppercase');
      expect(html).toContain('id="job-title"');
      expect(html).toContain('placeholder="e.g. Senior Frontend Architect"');
    });

    it('renders Input with error message and applies error border glow classes', () => {
      const html = renderToString(
        <Input
          label="Email Address"
          error="Please provide a valid corporate email"
          helperText="We will never share your email"
        />
      );
      expect(html).toContain('Please provide a valid corporate email');
      expect(html).toContain('border-rose-500/70');
      // Helper text should be hidden when error is present
      expect(html).not.toContain('We will never share your email');
    });

    it('renders helperText when no error is present', () => {
      const html = renderToString(
        <Input label="Search" helperText="Type at least 2 characters" />
      );
      expect(html).toContain('Type at least 2 characters');
    });

    it('renders left and right icon slots with appropriate padding offsets', () => {
      const html = renderToString(
        <Input
          label="Search Candidate"
          leftIcon={<span className="left-search-icon">🔍</span>}
          rightIcon={<span className="right-clear-icon">✖</span>}
        />
      );
      expect(html).toContain('left-search-icon');
      expect(html).toContain('right-clear-icon');
      expect(html).toContain('pl-10');
      expect(html).toContain('pr-10');
    });

    it('renders Textarea with label, custom rows, and error states', () => {
      const html = renderToString(
        <Textarea
          label="Job Description"
          rows={6}
          error="Job description is required"
          placeholder="Paste job description..."
        />
      );
      expect(html).toContain('Job Description');
      expect(html).toContain('uppercase');
      expect(html).toContain('id="job-description"');
      expect(html).toContain('rows="6"');
      expect(html).toContain('Job description is required');
      expect(html).toContain('border-rose-500/70');
    });

    it('renders disabled inputs and textareas', () => {
      const htmlInput = renderToString(<Input label="Disabled Input" disabled />);
      expect(htmlInput).toContain('disabled=""');
      expect(htmlInput).toContain('disabled:cursor-not-allowed');

      const htmlTextarea = renderToString(<Textarea label="Disabled Area" disabled />);
      expect(htmlTextarea).toContain('disabled=""');
      expect(htmlTextarea).toContain('disabled:cursor-not-allowed');
    });
  });

  describe('6. Tabs Primitive Stress Suite', () => {
    const tabs: TabItem[] = [
      { id: 'overview', label: 'Overview', count: 12 },
      { id: 'skills', label: 'Skills Radar', count: 8 },
      { id: 'experience', label: 'Work History' },
    ];

    it('renders tab list with active tab highlighted and layoutId animation pill', () => {
      const html = renderToString(
        <Tabs tabs={tabs} activeTab="overview" onChange={() => {}} />
      );
      expect(html).toContain('role="tablist"');
      expect(html).toContain('Overview');
      expect(html).toContain('Skills Radar');
      expect(html).toContain('Work History');
      expect(html).toContain('aria-selected="true"');
      expect(html).toContain('12');
      expect(html).toContain('8');
    });

    it('renders small size tab bar', () => {
      const html = renderToString(
        <Tabs tabs={tabs} activeTab="skills" size="sm" onChange={() => {}} />
      );
      expect(html).toContain('text-xs px-3 py-1.5');
    });

    it('handles empty tabs array gracefully', () => {
      const html = renderToString(<Tabs tabs={[]} activeTab="" onChange={() => {}} />);
      expect(html).toContain('role="tablist"');
    });
  });

  describe('7. Skeleton Shimmer Suite', () => {
    it('renders basic Skeleton with rectangular, circular, and rounded variants', () => {
      const htmlRect = renderToString(<Skeleton variant="rectangular" className="h-4 w-32" />);
      expect(htmlRect).toContain('rounded-none');
      expect(htmlRect).toContain('animate-shimmer');

      const htmlCirc = renderToString(<Skeleton variant="circular" className="w-10 h-10" />);
      expect(htmlCirc).toContain('rounded-full');

      const htmlRound = renderToString(<Skeleton variant="rounded" className="h-20 w-full" />);
      expect(htmlRound).toContain('rounded-xl');
    });

    it('renders SkeletonText with custom line counts and last line width', () => {
      const html = renderToString(<SkeletonText lines={4} lastLineWidth="45%" />);
      expect(html).toContain('space-y-2.5');
      expect(html).toContain('width:45%');
    });

    it('renders SkeletonCard and SkeletonStatCard composite placeholders', () => {
      const htmlCard = renderToString(<SkeletonCard />);
      expect(htmlCard).toContain('glass-card');
      expect(htmlCard).toContain('rounded-full');

      const htmlStat = renderToString(<SkeletonStatCard />);
      expect(htmlStat).toContain('glass-card');
    });
  });

  describe('8. Responsive Layout Shell & Navigation Stress Suite', () => {
    it('renders Sidebar with all 4 authoritative navigation routes', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/']}>
          <Sidebar />
        </MemoryRouter>
      );

      expect(html).toContain('ResumeIQ');
      expect(html).toContain('AI Engine Online');
      expect(html).toContain('99.9%');

      navItems.forEach((item) => {
        // Handle HTML entity escaping for ampersands
        const escapedLabel = item.label.replace('&', '&amp;');
        expect(html).toContain(escapedLabel);
      });
      expect(html).toContain('AI Parse'); // Badge on Upload
    });

    it('renders Topbar with dynamic breadcrumbs and quick actions', () => {
      const htmlDashboard = renderToString(
        <MemoryRouter initialEntries={['/']}>
          <Topbar />
        </MemoryRouter>
      );
      expect(htmlDashboard).toContain('Dashboard');
      expect(htmlDashboard).toContain('Upload Resume');
      expect(htmlDashboard).toContain('Create Job');
      expect(htmlDashboard).toContain('Recruiter Cockpit');

      const htmlCandidates = renderToString(
        <MemoryRouter initialEntries={['/candidates']}>
          <Topbar />
        </MemoryRouter>
      );
      expect(htmlCandidates).toContain('Candidates Directory');
    });

    it('renders MobileNav drawer when isOpen is true and hides when false', () => {
      const htmlOpen = renderToString(
        <MemoryRouter initialEntries={['/']}>
          <MobileNav isOpen={true} onClose={() => {}} />
        </MemoryRouter>
      );
      expect(htmlOpen).toContain('bg-slate-950/95');
      expect(htmlOpen).toContain('aria-label="Close navigation menu"');
      expect(htmlOpen).toContain('FastNLP Engine Ready');

      const htmlClosed = renderToString(
        <MemoryRouter initialEntries={['/']}>
          <MobileNav isOpen={false} onClose={() => {}} />
        </MemoryRouter>
      );
      expect(htmlClosed).toBe('');
    });

    it('renders AmbientGlow mesh background with aria-hidden="true"', () => {
      const html = renderToString(<AmbientGlow />);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('pointer-events-none');
      expect(html).toContain('blur-3xl');
    });

    it('renders master LayoutShell encapsulating AmbientGlow, Sidebar, Topbar, and Main Content', () => {
      const html = renderToString(
        <MemoryRouter initialEntries={['/']}>
          <LayoutShell>
            <div data-testid="page-content">Dashboard Content Loaded</div>
          </LayoutShell>
        </MemoryRouter>
      );

      expect(html).toContain('Dashboard Content Loaded');
      expect(html).toContain('max-w-7xl mx-auto');
      expect(html).toContain('bg-[#0A0E1A]');
    });
  });

  describe('9. Brand Icons & Telemetry Utility Suite', () => {
    it('renders all custom brand and indicator SVG components without crashing', () => {
      const htmlLinkedin = renderToString(<LinkedinIcon className="w-6 h-6 text-indigo-400" />);
      expect(htmlLinkedin).toContain('<svg');
      expect(htmlLinkedin).toContain('w-6 h-6 text-indigo-400');

      const htmlGithub = renderToString(<GithubIcon className="w-5 h-5 text-slate-300" />);
      expect(htmlGithub).toContain('<svg');

      const htmlTwitter = renderToString(<TwitterIcon />);
      expect(htmlTwitter).toContain('<svg');

      const htmlPortfolio = renderToString(<PortfolioIcon />);
      expect(htmlPortfolio).toContain('<svg');

      const htmlSparkles = renderToString(<SparklesIcon />);
      expect(htmlSparkles).toContain('<svg');

      const htmlBrain = renderToString(<BrainCircuitIcon />);
      expect(htmlBrain).toContain('<svg');

      const htmlPulse = renderToString(<PulseDot color="bg-emerald-400" ping={true} />);
      expect(htmlPulse).toContain('animate-ping');
      expect(htmlPulse).toContain('bg-emerald-400');
    });
  });

});
