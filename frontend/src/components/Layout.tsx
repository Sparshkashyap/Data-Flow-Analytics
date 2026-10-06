import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Orders', to: '/orders' },
  { label: 'Products', to: '/products' },
  { label: 'Shipments', to: '/shipments' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Countries', to: '/countries' },
  { label: 'Data Quality', to: '/quality' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-200 bg-white shadow-sm">
        <div className="flex h-16 items-center border-b border-slate-200 px-6 text-xl font-bold text-slate-800">
          Drive Project
        </div>
        <nav className="space-y-2 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 font-medium transition ${
                  isActive ? 'bg-blue-600 text-white shadow' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="ml-64 min-h-screen p-6">
        <Outlet />
      </main>
    </div>
  );
}
