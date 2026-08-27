export default function Layout({ children, wide = false }) {
  return (
    <div className={wide ? 'page-container-wide' : 'page-container'}>
      {children}
    </div>
  );
}
