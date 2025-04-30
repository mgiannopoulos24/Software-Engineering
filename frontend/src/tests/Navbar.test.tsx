import { IndexNavbar } from '@/components/layout/IndexNavbar';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Complete mock of all icons used in the IndexNavbar component
vi.mock('lucide-react', () => ({
  LogIn: () => <div data-testid="login-icon">Login Icon</div>,
  UserPlus: () => <div data-testid="signup-icon">Signup Icon</div>,
  LocateFixed: () => <div data-testid="locate-fixed-icon">Locate Fixed Icon</div>,
  User: () => <div data-testid="user-icon">User Icon</div>,
  Settings: () => <div data-testid="settings-icon">Settings Icon</div>,
  LogOut: () => <div data-testid="logout-icon">Logout Icon</div>,
  Menu: () => <div data-testid="menu-icon">Menu Icon</div>,
  X: () => <div data-testid="x-icon">X Icon</div>,
  Bell: () => <div data-testid="bell-icon">Bell Icon</div>,
  Bookmark: () => <div data-testid="bookmark-icon">Bookmark Icon</div>,
  CircleUserRound: () => <div data-testid="circle-user-round-icon">Circle User Round Icon</div>,
  Compass: () => <div data-testid="compass-icon">Compass Icon</div>,
  Globe: () => <div data-testid="globe-icon">Globe Icon</div>,
  Info: () => <div data-testid="info-icon">Info Icon</div>,
  Search: () => <div data-testid="search-icon">Search Icon</div>
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}));

describe('IndexNavbar Component', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.clearAllMocks();
  });

  it('renders the navigation bar', () => {
    render(<IndexNavbar />);
    const navElement = screen.getByRole('navigation');
    expect(navElement).toBeInTheDocument();
  });

  it('shows login and signup links when profile dropdown is opened', () => {
    render(<IndexNavbar />);
    
    // Initially, login and signup should not be visible
    expect(screen.queryByText(/Log In/i)).not.toBeInTheDocument();
    
    // Click on the profile icon to open the dropdown
    const profileButton = screen.getAllByText(/Profile/i)[0].closest('a');
    expect(profileButton).toBeInTheDocument();
    fireEvent.click(profileButton!);
    
    // After clicking, login and signup should be visible
    const desktopDropdown = profileButton!.parentElement;
    expect(within(desktopDropdown!).getByText(/Log In/i)).toBeInTheDocument();
    expect(within(desktopDropdown!).getByText(/Sign Up/i)).toBeInTheDocument();
  });

  it('toggles mobile menu when hamburger button is clicked', () => {
    render(<IndexNavbar />);
    
    // Find the hamburger button 
    const hamburgerButton = screen.getByRole('button', { 
      name: /Open main menu/i 
    });
    
    // Initial state - menu should be closed (translated out of view)
    const initialMobileMenu = document.getElementById('navbar-search');
    expect(initialMobileMenu).toHaveClass('translate-x-full');
    expect(initialMobileMenu).not.toHaveClass('translate-x-0');
    
    // Click to open
    fireEvent.click(hamburgerButton);
    
    // After clicking, menu should be open (visible)
    const openedMobileMenu = document.getElementById('navbar-search');
    expect(openedMobileMenu).toHaveClass('translate-x-0');
    expect(openedMobileMenu).not.toHaveClass('translate-x-full');
  });

  it('closes mobile menu when X button is clicked', () => {
    render(<IndexNavbar />);
    
    // First open the menu
    const hamburgerButton = screen.getByRole('button', { 
      name: /Open main menu/i 
    });
    fireEvent.click(hamburgerButton);
    
    // Menu should be open
    const openedMobileMenu = document.getElementById('navbar-search');
    expect(openedMobileMenu).toHaveClass('translate-x-0');
    
    // Find and click the close button
    const closeButton = screen.getByTestId('x-icon').closest('button');
    fireEvent.click(closeButton!);
    
    // Menu should be closed
    const closedMobileMenu = document.getElementById('navbar-search');
    expect(closedMobileMenu).toHaveClass('translate-x-full');
    expect(closedMobileMenu).not.toHaveClass('translate-x-0');
  });

  it('toggles profile dropdown in mobile menu', () => {
    render(<IndexNavbar />);
    
    // First open the mobile menu
    const hamburgerButton = screen.getByTestId('menu-icon').closest('button');
    fireEvent.click(hamburgerButton!);
    
    // Find the mobile menu container
    const mobileMenu = document.getElementById('navbar-search');
    
    // Profile dropdown items should not be visible initially
    expect(within(mobileMenu!).queryByText(/Log In/i)).not.toBeInTheDocument();
    
    // Click on the Profile link in mobile menu
    const mobileProfileLink = within(mobileMenu!).getByText(/Profile/i).closest('a');
    fireEvent.click(mobileProfileLink!);
    
    // Profile dropdown items should now be visible within mobile menu
    expect(within(mobileMenu!).getByText(/Log In/i)).toBeInTheDocument();
    expect(within(mobileMenu!).getByText(/Sign Up/i)).toBeInTheDocument();
  });

  it('renders search inputs', () => {
    render(<IndexNavbar />);
    
    // Check for search input elements
    const searchInputs = screen.getAllByRole('textbox');
    expect(searchInputs.length).toBeGreaterThan(0);
    
    // Open mobile menu
    const hamburgerButton = screen.getByTestId('menu-icon').closest('button');
    fireEvent.click(hamburgerButton!);
    
    // Should have search inputs in both desktop and mobile views
    const allSearchInputs = screen.getAllByRole('textbox');
    expect(allSearchInputs.length).toBeGreaterThan(1);
  });
});