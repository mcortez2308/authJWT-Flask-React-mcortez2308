/*import { Link } from "react-router-dom";

export const Navbar = () => {

	return (
		<nav className="navbar navbar-light bg-light">
			<div className="container">
				<Link to="/">
					<span className="navbar-brand mb-0 h1">React Boilerplate</span>
				</Link>
				<div className="ml-auto">
					<Link to="/demo">
						<button className="btn btn-primary">Check the Context in action</button>
					</Link>
				</div>
			</div>
		</nav>
	);
};*/

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const Navbar = () => {
	const [categorias, setCategorias] = useState([]);
	const navigate = useNavigate();
	const { store, dispatch } = useGlobalReducer();

	const isAuthenticated = Boolean(store?.auth?.isAuthenticated);
	const user = store?.auth?.user;

	const avatarUrl = user?.avatar_url;
	const avatarFallback = (user?.username?.[0] || user?.email?.[0] || "U").toUpperCase();

	const handleLogout = () => {
		localStorage.clear();
		dispatch({ type: "clear_auth" });
		navigate("/");
	};

	return (
		<nav className="navbar navbar-expand-lg navbar-dark" style={{ background: "#2e5a8a" }}>
			<div className="container">
				{/* LOGO */}
				<Link to="/" className="navbar-brand d-flex align-items-center gap-2" style={{ fontWeight: 700 }}>

					<div style={{ lineHeight: 1.1 }}>
						<div style={{ fontSize: "14px", letterSpacing: "0.05em" }}>PROYECTO DE AUTENTICACION</div>
					</div>
				</Link>

				{/* BOTÓN HAMBURGUESA (Solo se ve en celulares) */}
				<button
					className="navbar-toggler"
					type="button"
					data-bs-toggle="collapse"
					data-bs-target="#navbarNav"
					aria-controls="navbarNav"
					aria-expanded="false"
					aria-label="Toggle navigation"
				>
					<span className="navbar-toggler-icon"></span>
				</button>

				{/* MENÚ COLAPSABLE (Esconde los elementos en móvil y los apila) */}
				<div className="collapse navbar-collapse" id="navbarNav">
					<div className="navbar-nav ms-auto align-items-lg-center gap-3 pt-3 pt-lg-0">

						<Link className="nav-link text-white" to="/">Ir a Inicio...</Link>

						{!isAuthenticated && (
							<Link className="nav-link text-white" to="/register">Registrate</Link>
						)}

						{/* Dropdown Opciones de Usuario */}
						{isAuthenticated && (
							<div className="dropdown">
								<button className="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown">
									Mis Actividades
								</button>
								<ul className="dropdown-menu dropdown-menu-end">
									<>
										<li><Link className="dropdown-item" to="/loguedactivities">Actividades Logueado</Link></li>
									</>
								</ul>
							</div>
						)}

						{!isAuthenticated ? (
							<button
								className="btn btn-outline-light"
								style={{ fontWeight: 600, padding: "8px 20px", borderRadius: "8px" }}
								onClick={() => navigate("/login")}
							>
								LOGIN
							</button>
						) : (
							<div className="d-flex align-items-center gap-2">
								<div
									className="d-flex align-items-center justify-content-center"
									style={{
										width: "34px", height: "34px", borderRadius: "50%",
										overflow: "hidden", border: "2px solid #C8F135",
										background: "#14263b", color: "#fff", fontWeight: 700, fontSize: "12px"
									}}
									title={user?.username || user?.email}
								>
									{avatarUrl ? (
										<img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
									) : (
										<span>{avatarFallback}</span>
									)}
								</div>
								<button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
									Log Out
								</button>
							</div>
						)}

					</div>
				</div>
			</div>
		</nav>
	);
};