import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/user.services";
import useGlobalReducer from "../hooks/useGlobalReducer";

const initialLoginState = {
    email: "",
    password: "",
};

export const Login = () => {
    const navigate = useNavigate();
    const { dispatch } = useGlobalReducer();
    const [credentials, setCredentials] = useState(initialLoginState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = ({ target }) => {
        const { name, value } = target;
        setCredentials((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        loginUser(credentials)
            .then((response) => {
                // 1. Validar la existencia del token
                if (!response?.access_token || response.access_token === "undefined" || response.access_token === "null") {
                    throw new Error("El servidor no devolvió un token de acceso válido.");
                }

                // 2. 🛡️ CONTROL TEMPORAL EN FRONTEND: Verificar si el usuario está activado
                // Reemplaza 'is_active' por la propiedad exacta que devuelva tu backend (ej. is_verified, active, status)
                if (response.user && response.user.is_active === false) {
                    throw new Error("Tu cuenta aún no ha sido activada. Revisa tu correo electrónico para validarla.");
                }

                // 3. Proceder con el inicio de sesión si está activo
                localStorage.setItem("access_token", response.access_token);
                localStorage.setItem("user", JSON.stringify(response.user));

                dispatch({
                    type: "set_auth",
                    payload: {
                        token: response.access_token,
                        user: response.user,
                    },
                });

                navigate("/");
            })
            .catch((error) => {
                // Captura el mensaje de cuenta no activada o los errores de red
                setError(error.message || "Error al iniciar sesión. Por favor, inténtalo de nuevo.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <form className="border p-4 rounded bg-light" onSubmit={handleSubmit}>
                        <h1 className="text-center mb-4 h3">Iniciar Sesión</h1>

                        {error && <div className="alert alert-danger" role="alert">{error}</div>}

                        <div className="mb-3 form-group">
                            <label htmlFor="email" className="form-label">Correo Electrónico</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                name="email"
                                placeholder="Introduce tu correo"
                                value={credentials.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3 form-group">
                            <label htmlFor="password" className="form-label">Contraseña</label>
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                name="password"
                                placeholder="Introduce tu contraseña"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="d-grid">
                            <button type="submit" className="btn btn-auth-shared" disabled={loading}>
                                {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                            </button>
                        </div>

                        <p className="text-center mt-3 mb-1">
                            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
                        </p>
                        <p className="text-center mb-0">
                            <Link to="/forgot-password">Recordar contraseña</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};
