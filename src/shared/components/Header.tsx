function Header() {
  return (
    <header className="flex items-center justify-between border-b bg-white px-8 py-5">
      <h1 className="text-2xl font-bold">
        Student Dashboard
      </h1>

      <div className="flex items-center gap-4">
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Notifications
        </button>

        <div className="h-10 w-10 rounded-full bg-slate-300" />
      </div>
    </header>
  );
}

export default Header;