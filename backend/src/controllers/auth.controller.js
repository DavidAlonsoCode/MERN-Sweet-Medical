import AuthService from "../services/auth.services.js";

class AuthController {
    constructor() {
        this.authService = AuthService.instance();
    }

    login = async (req, res, next) => {
        try {
            const { usuario, password } = req.body;

            if (!usuario || !password) {
                return res.status(400).json({ message: "Usuario y contraseña son requeridos." });
            }

            // Llamamos a la lógica de negocio que ya tenías armada
            const result = await this.authService.login(usuario, password);

            // Devolvemos el token y los datos del usuario al frontend
            res.status(200).json(result);
        } catch (error) {
            // Si el servicio tira el error "Credenciales inválidas", devolvemos un 401 Unauthorized
            if (error.message === "Credenciales inválidas.") {
                return res.status(401).json({ message: error.message });
            }
            next(error);
        }
    };
}

export default new AuthController();