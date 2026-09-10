import { useState, type MouseEvent } from 'react';
import { Hexagon, Menu, X, Zap, Settings, HelpCircle, Github, ExternalLink, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleNavHover = (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.currentTarget.style.color = '#292524';
    e.currentTarget.style.background = '#FAF9F6';
  };

  const handleNavLeave = (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.currentTarget.style.color = '#78716C';
    e.currentTarget.style.background = 'transparent';
  };

  const navItems = [
    { label: 'Workspace', to: '/workspace', icon: Zap },
    { label: 'Docs', to: '/docs', icon: BookOpen, external: 'https://github.com/almoizsaad/appy#readme' },
    { label: 'GitHub', to: '/github', icon: Github, external: 'https://github.com/almoizsaad/appy' },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14"
      style={{ background: 'rgba(253, 252, 248, 0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E7E5E4' }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="h-full flex items-center justify-between px-4 lg:px-6 max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] focus-visible:ring-offset-2 rounded-lg"
          aria-label="Nexus Home"
        >
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-lg"
              style={{ background: '#1C1917' }}
            />
            <Hexagon className="relative w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-lg font-semibold tracking-tight hidden sm:block" style={{ color: '#292524', fontFamily: 'Playfair Display, serif' }}>
            NEXUS
          </span>
          <span
            className="hidden md:inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ color: '#BE123C', background: 'rgba(190, 18, 60, 0.06)', border: '1.5px dashed rgba(190, 18, 60, 0.3)', transform: 'rotate(-1deg)' }}
          >
            <Zap className="w-3 h-3" />
            Intelligence OS
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const label = item.label === 'Workspace' ? 'Control Plane' : item.label;
            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.external}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] focus-visible:ring-offset-2 flex items-center gap-1.5"
                  style={{ color: isActive ? '#292524' : '#78716C' }}
                  onMouseEnter={handleNavHover}
                  onMouseLeave={handleNavLeave}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {label}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              );
            }
            return (
              <Link
                key={item.label}
                to={item.to}
                className="px-3 py-1.5 text-[13px] font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] focus-visible:ring-offset-2 flex items-center gap-1.5"
                style={{
                  color: isActive ? '#292524' : '#78716C',
                  background: isActive ? '#FAF9F6' : 'transparent',
                }}
                onMouseEnter={handleNavHover}
                onMouseLeave={handleNavLeave}
              >
                <item.icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] focus-visible:ring-offset-2"
            style={{ color: '#78716C' }}
            onMouseEnter={handleNavHover}
            onMouseLeave={handleNavLeave}
            aria-label="Help"
            title="Help & Documentation"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] focus-visible:ring-offset-2"
            style={{ color: '#78716C' }}
            onMouseEnter={handleNavHover}
            onMouseLeave={handleNavLeave}
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <a
            href="https://github.com/almoizsaad/appy"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] focus-visible:ring-offset-2"
            style={{ color: '#78716C' }}
            onMouseEnter={handleNavHover}
            onMouseLeave={handleNavLeave}
            aria-label="GitHub"
            title="View on GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BE123C] focus-visible:ring-offset-2"
            style={{ color: '#78716C' }}
            onMouseEnter={handleNavHover}
            onMouseLeave={handleNavLeave}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 py-3 border-t"
          style={{ background: 'rgba(253, 252, 248, 0.98)', borderColor: '#E7E5E4' }}
        >
          {navItems.map((item) => {
            const label = item.label === 'Workspace' ? 'Control Plane' : item.label;
            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.external}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-all"
                  style={{ color: '#78716C' }}
                  onMouseEnter={handleNavHover}
                  onMouseLeave={handleNavLeave}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  {label}
                  <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                </a>
              );
            }
            return (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-all"
                style={{ color: '#78716C' }}
                onMouseEnter={handleNavHover}
                onMouseLeave={handleNavLeave}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
