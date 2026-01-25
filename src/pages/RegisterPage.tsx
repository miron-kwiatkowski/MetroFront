import RegisterForm from '../components/RegisterForm';

export default function RegisterPage() {
    return (
        <div className="page">
            <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
                <h1>Rejestracja</h1>
                <p className="muted">Utwórz konto, a potem zaloguj się.</p>
                <RegisterForm />
            </div>
        </div>
    );
}
