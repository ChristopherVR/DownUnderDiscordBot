import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Reorder } from 'framer-motion';
import { useLayoutStore } from '@/stores/useLayoutStore';
import {
  LayoutDashboard,
  ListMusic,
  Search,
  Library,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  GripVertical,
  ClipboardList,
  ScrollText,
} from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

const defaultNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/queue', label: 'Queue', icon: ListMusic },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/command-logs', label: 'Command Logs', icon: ClipboardList },
  { to: '/logs', label: 'Logs', icon: ScrollText },
];

const navItemMap = new Map(defaultNavItems.map((item) => [item.to, item]));

/** Maps a nav item's route to the `data-testid` E2E tests look for. */
const navTestIds: Record<string, string> = {
  '/dashboard': 'sidebar-nav-dashboard',
  '/queue': 'sidebar-nav-queue',
  '/search': 'sidebar-nav-search',
  '/library': 'sidebar-nav-library',
  '/logs': 'sidebar-nav-logs',
};

/** Single draggable nav item */
function DraggableNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <Reorder.Item
      value={item.to}
      className="list-none"
      style={{ touchAction: 'none' }}
      whileDrag={{
        scale: 1.04,
        zIndex: 50,
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        borderRadius: 8,
        cursor: 'grabbing',
      }}
      transition={{ duration: 0.15 }}
    >
      <div className="group/drag relative flex cursor-grab items-center active:cursor-grabbing">
        {/* Drag handle indicator */}
        <div
          className={cn(
            'pointer-events-none flex shrink-0 items-center justify-center opacity-0 transition-opacity group-hover/drag:opacity-60',
            collapsed ? 'absolute -left-0.5 z-10 h-full w-4' : 'w-5',
          )}
        >
          <GripVertical size={12} className="text-t-faint" />
        </div>

        <NavLink
          data-testid={navTestIds[item.to]}
          draggable={false}
          to={item.to}
          title={collapsed ? item.label : undefined}
          onPointerDown={(_e) => {
            // Allow drag to start from anywhere on the row —
            // NavLink only navigates on click (pointerup), so this is safe.
          }}
          className={({ isActive }) =>
            cn(
              'group relative flex flex-1 items-center rounded-lg py-2.5 text-[13px] font-medium transition-all duration-200',
              collapsed ? 'justify-center px-2' : 'gap-3 px-3',
              isActive ? 'text-t-primary' : 'text-t-tertiary hover:text-t-secondary',
            )
          }
          style={({ isActive }) => ({
            background: isActive ? 'var(--nav-active-bg)' : undefined,
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
              <item.icon size={18} style={isActive ? { color: 'var(--accent)' } : undefined} />
              {!collapsed && <span>{item.label}</span>}
            </>
          )}
        </NavLink>
      </div>
    </Reorder.Item>
  );
}

export default function Sidebar() {
  const collapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const navOrder = useLayoutStore((s) => s.navOrder);
  const setNavOrder = useLayoutStore((s) => s.setNavOrder);

  const sidebarWidth = collapsed ? 'w-[60px]' : 'w-[220px]';

  // Derive ordered items from persisted order, falling back to defaults
  const orderedItems = useMemo(() => {
    if (!navOrder.length) return defaultNavItems;
    const items: NavItem[] = [];
    for (const path of navOrder) {
      const item = navItemMap.get(path);
      if (item) items.push(item);
    }
    // Append any new items not yet in the saved order
    for (const item of defaultNavItems) {
      if (!navOrder.includes(item.to)) items.push(item);
    }
    return items;
  }, [navOrder]);

  // The Reorder.Group works with an array of unique string values
  const orderedPaths = useMemo(() => orderedItems.map((i) => i.to), [orderedItems]);

  const renderSettingsLink = () => (
    <NavLink
      data-testid="sidebar-nav-settings"
      to="/settings"
      title={collapsed ? 'Settings' : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center rounded-lg py-2.5 text-[13px] font-medium transition-all duration-200',
          collapsed ? 'justify-center px-2' : 'gap-3 px-3',
          isActive ? 'text-t-primary' : 'text-t-tertiary hover:text-t-secondary',
        )
      }
      style={({ isActive }) => ({
        background: isActive ? 'var(--nav-active-bg)' : undefined,
      })}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div
              className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full"
              style={{ background: 'var(--gradient-accent)' }}
            />
          )}
          <Settings size={18} style={isActive ? { color: 'var(--accent)' } : undefined} />
          {!collapsed && <span>Settings</span>}
        </>
      )}
    </NavLink>
  );

  return (
    <aside
      data-testid="app-sidebar"
      className={cn(
        'fixed left-0 top-9 z-30 flex flex-col backdrop-blur-2xl transition-all duration-300 ease-in-out',
        sidebarWidth,
      )}
      style={{
        height: 'calc(100vh - 2.25rem - 5rem)',
        borderRight: '1px solid var(--playerbar-border)',
        background: 'var(--sidebar-bg)',
      }}
    >
      {/* Logo + Collapse toggle */}
      <div className={cn('flex items-center py-5', collapsed ? 'justify-center px-2' : 'gap-3 px-4')}>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-glow-green"
          style={{ background: 'var(--gradient-accent)' }}
        >
          <AppIcon size={16} style={{ color: 'var(--btn-primary-fg)' }} />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <span className="text-sm font-bold tracking-tight text-t-primary">Down Under</span>
            <p className="text-[10px] font-medium uppercase tracking-widest text-t-faint">Music</p>
          </div>
        )}
      </div>

      {/* Collapse / Expand pin */}
      <div className={cn('px-2', collapsed ? 'flex justify-center' : 'flex justify-end')}>
        <button
          onClick={toggleSidebar}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="flex h-7 w-7 items-center justify-center rounded-md text-t-faint transition-colors hover:text-t-secondary"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nav-hover-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* Main Navigation — drag-and-drop reorderable */}
      <Reorder.Group
        as="nav"
        axis="y"
        values={orderedPaths}
        onReorder={setNavOrder}
        className="mt-1 flex flex-1 flex-col gap-0.5 px-2"
      >
        {orderedItems.map((item) => (
          <DraggableNavItem key={item.to} item={item} collapsed={collapsed} />
        ))}
      </Reorder.Group>

      {/* Settings pinned at bottom */}
      <div className="px-2 pb-3">{renderSettingsLink()}</div>
    </aside>
  );
}
