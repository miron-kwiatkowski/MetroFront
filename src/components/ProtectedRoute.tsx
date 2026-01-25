import { useContext, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

type Props = {
    children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
    const { token } = useContext(AuthContext);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
