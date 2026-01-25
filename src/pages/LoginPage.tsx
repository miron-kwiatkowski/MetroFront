import LoginForm from '../components/LoginForm';

export default function LoginPage() {
    return (
        <div className="page">
            <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
                <h1>Logowanie</h1>
                <p className="muted">Zaloguj się, żeby przejść do schematów.</p>
                <LoginForm />
            </div>
        </div>
    );
}
