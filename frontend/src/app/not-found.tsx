export default function NotFound() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>404</h1>
        <p>Sidan kunde inte hittas</p>
        <a href="/" style={{ color: '#0070f3' }}>Tillbaka till startsidan</a>
      </div>
    </div>
  );
}
