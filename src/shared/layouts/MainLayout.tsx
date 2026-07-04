type MainLayoutProps = {
  children: React.ReactNode;
};

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div>
      <header>
        <h2>PronounceLab</h2>
      </header>

      <main>{children}</main>

      <footer>
        <small>© 2026 PronounceLab</small>
      </footer>
    </div>
  );
}

export default MainLayout;