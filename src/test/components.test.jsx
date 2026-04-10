/**
 * Frontend Component Tests
 * Tests React components for rendering and accessibility
 * @module tests/components
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import ProgressRing from '../components/ProgressRing';
import Sidebar from '../components/Sidebar';

// ============================================
// ErrorBoundary Tests
// ============================================
describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Hello</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders error fallback when child throws', () => {
    const ThrowingComponent = () => { throw new Error('Test error'); };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Reload App')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('error fallback has aria-live for screen readers', () => {
    const ThrowingComponent = () => { throw new Error('Oops'); };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><ThrowingComponent /></ErrorBoundary>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    consoleSpy.mockRestore();
  });
});

// ============================================
// ProgressRing Tests
// ============================================
describe('ProgressRing', () => {
  it('renders with label and accessible aria', () => {
    const { container } = render(<ProgressRing value={50} max={100} size={100} strokeWidth={8} color="green" label="CAL" />);
    // Initially shows 0 (pre-animation), label always visible
    expect(screen.getByText('CAL')).toBeInTheDocument();
    // aria-label reflects actual value
    expect(container.querySelector('[role="img"]')).toHaveAttribute('aria-label', 'CAL: 50 of 100');
  });

  it('renders an accessible SVG', () => {
    const { container } = render(
      <ProgressRing value={75} max={100} size={80} strokeWidth={6} color="blue" label="PROTEIN" />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('aria-label shows raw value even if above max', () => {
    const { container } = render(<ProgressRing value={150} max={100} size={100} strokeWidth={8} color="red" label="TEST" />);
    expect(container.querySelector('[role="img"]')).toHaveAttribute('aria-label', 'TEST: 150 of 100');
  });
});

// ============================================
// Sidebar Tests
// ============================================
describe('Sidebar', () => {
  it('renders navigation links', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Food Scanner')).toBeInTheDocument();
    expect(screen.getByText('Food Log')).toBeInTheDocument();
    expect(screen.getByText('Meal Planner')).toBeInTheDocument();
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();
    expect(screen.getByText('Profile & Goals')).toBeInTheDocument();
  });

  it('has semantic navigation landmark', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('links have accessible names', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAccessibleName();
    });
  });
});

// ============================================
// API Client Tests  
// ============================================
describe('API Client', () => {
  it('exports all API modules', async () => {
    const api = await import('../api');
    expect(api.userApi).toBeDefined();
    expect(api.foodLogApi).toBeDefined();
    expect(api.scanApi).toBeDefined();
    expect(api.waterApi).toBeDefined();
    expect(api.achievementsApi).toBeDefined();
    expect(api.insightsApi).toBeDefined();
    expect(api.mealPlanApi).toBeDefined();
  });

  it('userApi has required methods', async () => {
    const { userApi } = await import('../api');
    expect(typeof userApi.get).toBe('function');
    expect(typeof userApi.update).toBe('function');
    expect(typeof userApi.updateGoals).toBe('function');
    expect(typeof userApi.getStreak).toBe('function');
  });

  it('scanApi has required methods', async () => {
    const { scanApi } = await import('../api');
    expect(typeof scanApi.image).toBe('function');
    expect(typeof scanApi.barcode).toBe('function');
    expect(typeof scanApi.save).toBe('function');
    expect(typeof scanApi.history).toBe('function');
  });

  it('foodLogApi has CRUD methods', async () => {
    const { foodLogApi } = await import('../api');
    expect(typeof foodLogApi.get).toBe('function');
    expect(typeof foodLogApi.add).toBe('function');
    expect(typeof foodLogApi.update).toBe('function');
    expect(typeof foodLogApi.delete).toBe('function');
    expect(typeof foodLogApi.getStats).toBe('function');
    expect(typeof foodLogApi.getWeekly).toBe('function');
  });
});
