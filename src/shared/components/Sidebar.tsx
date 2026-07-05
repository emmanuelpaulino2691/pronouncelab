function Sidebar() {
  const items = [
    "Dashboard",
    "Courses",
    "Progress",
    "Badges",
    "Profile",
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-8">
        PronounceLab
      </h2>

      <nav>
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item}
              className="cursor-pointer rounded-lg px-3 py-2 transition hover:bg-slate-700"
            >
              {item}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;