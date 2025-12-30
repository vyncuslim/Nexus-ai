export default function Terms() {
  return (
    <main style={{ padding: 24, backgroundColor: '#020617', color: '#cbd5e1', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '1.5rem', color: '#fff' }}>Terms of Service</h1>
      <div style={{ lineHeight: 1.6, maxWidth: '800px' }}>
        <p style={{ marginBottom: '1rem' }}>
          By using NEXUS-AI, you agree to use the service responsibly.
          The service is provided on an "as is" basis without warranties.
        </p>
        <p style={{ marginBottom: '1rem' }}>
          We reserve the right to modify or discontinue the service at any time.
        </p>
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2rem' }}>
          Mothership Protocol v2.5.0
        </p>
      </div>
    </main>
  );
}