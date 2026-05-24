import { useState, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { registerUser } from "../services/user.services"

const initialStateUser = {
    email: "",
    username: "",
    full_name: "",
    password: "",
    avatar: null
}

export const Register = () => {
    const [user, setUser] = useState(initialStateUser)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false) // Estado para visibilidad de contraseña
    const avatarInputRef = useRef(null)
    const navigate = useNavigate()

    const handleChange = ({ target }) => {
        const { name, value } = target
        setUser((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        setError(null)
        setSuccess(null)

        setLoading(true)

        const formData = new FormData()
        formData.append("email", user.email)
        formData.append("username", user.username)
        formData.append("full_name", user.full_name)
        formData.append("password", user.password)
        if (user.avatar) {
            formData.append("avatar_url", user.avatar)
        }

        registerUser(formData)
            .then((response) => {
                setSuccess(response?.message || "Usuario registrado. Revisa tu correo para activar la cuenta.")
                setUser({ ...initialStateUser })

                if (avatarInputRef.current) {
                    avatarInputRef.current.value = ""
                }

                // Redirección automática controlada después de 4 segundos
                setTimeout(() => {
                    navigate("/login")
                }, 4000)
            })
            .catch((error) => {
                setError(error?.message || "Error al registrar el usuario. Inténtalo de nuevo.")
            })
            .finally(() => {
                setLoading(false)
            })
    }

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">

                    <form className="border p-4 rounded bg-light" onSubmit={handleSubmit}>
                        <h1 className="text-center mb-4 h3">Crear Cuenta</h1>

                        {error && <div className="alert alert-danger" role="alert">{error}</div>}
                        {success && <div className="alert alert-success" role="alert">{success}</div>}

                        <div className="mb-3 form-group">
                            <label htmlFor="email" className="form-label">Correo Electrónico</label>
                            <input
                                type="email"
                                className="form-control"
                                id="email"
                                placeholder="Introduce tu correo"
                                name="email"
                                value={user.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3 form-group">
                            <label htmlFor="username" className="form-label">Nombre de Usuario</label>
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                placeholder="Introduce tu nombre de usuario"
                                name="username"
                                value={user.username}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3 form-group">
                            <label htmlFor="full_name" className="form-label">Nombre Completo</label>
                            <input
                                type="text"
                                className="form-control"
                                id="full_name"
                                placeholder="Introduce tu nombre completo"
                                name="full_name"
                                value={user.full_name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3 form-group">
                            <label htmlFor="password" className="form-label">Contraseña</label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control"
                                    id="password"
                                    placeholder="Introduce tu contraseña"
                                    name="password"
                                    value={user.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    style={{ fontSize: "13px", fontWeight: "500" }}
                                >
                                    {showPassword ? "Ocultar" : "Mostrar"}
                                </button>
                            </div>
                        </div>

                        <div className="mb-3 form-group">
                            <label htmlFor="avatar" className="form-label">Avatar (Opcional)</label>
                            <input
                                type="file"
                                className="form-control"
                                id="avatar"
                                name="avatar"
                                accept="image/*"
                                ref={avatarInputRef}
                                onChange={(event) => setUser((prev) => ({ ...prev, avatar: event.target.files[0] }))}
                            />
                        </div>

                        <div className="d-grid">
                            <button type="submit" disabled={loading} className="btn btn-auth-shared">
                                {loading ? "Registrando..." : "Registrarse"}
                            </button>
                        </div>

                        <p className="text-center mt-3 mb-0">
                            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    )
}
