
export default function Privacy() {
  return (
    <main style={{ padding: 24, backgroundColor: '#020617', color: '#cbd5e1', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', marginBottom: '1.5rem', color: '#fff' }}>Privacy Policy</h1>
      <div style={{ lineHeight: 1.6, maxWidth: '800px' }}>
        <p style={{ marginBottom: '1rem' }}>
          NEXUS-AI uses Google Sign-In to authenticate users.
          We collect basic profile information such as email and profile name
          solely for account creation and login.
        </p>
        <p style={{ marginBottom: '1rem' }}>
          We do not sell or share user data with third parties.
          Users can request account and data deletion at any time.
        </p>
        <p style={{ marginTop: '2rem' }}>Contact: vyncuslim121@gmail.com</p>
      </div>
    </main>
  );
}
