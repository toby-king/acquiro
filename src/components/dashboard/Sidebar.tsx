import { useState } from 'react';
import { 
  LayoutDashboard, 
  Phone, 
  PenSquare, 
  CalendarDays,
  Settings
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'calls', icon: Phone, label: 'Calls' },
  { id: 'notes', icon: PenSquare, label: 'Notes' },
  { id: 'calendar', icon: CalendarDays, label: 'Calendar' },
];

export function Sidebar() {
  const [activeItem, setActiveItem] = useState('dashboard');

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-16 bg-[var(--bg-secondary)] border-r border-[var(--border)] flex-col items-center py-6 gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-accent/20 text-accent'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}

        {/* Settings at bottom */}
        <div className="mt-auto">
          <button
            className="min-h-[44px] min-w-[44px] rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-all"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex items-center justify-around py-2 px-4 z-40">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveItem(item.id)}
              className={`flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] py-2 px-3 rounded-lg transition-all ${
                isActive
                  ? 'text-accent'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
