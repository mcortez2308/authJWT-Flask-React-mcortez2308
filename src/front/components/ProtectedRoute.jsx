
import { Link, Outlet } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ProtectedRoute = () => {
    const { store } = useGlobalReducer();
    const isAuthenticated = Boolean(store?.auth?.isAuthenticated);

    // Si no está autenticado, muestra alerta y CTA hacia login.
    if (!isAuthenticated) {
        return (
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="alert alert-warning" role="alert">
                            Debes loguearte para poder acceder a este recurso.
                        </div>
                        <div className="d-grid">
                            <Link to="/login" className="btn btn-auth-shared-light navbar-action-btn">
                                Ir a Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Si está autenticado, renderiza el contenido de la ruta
    return <Outlet />;
};
