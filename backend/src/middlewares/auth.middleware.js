import jwt from "jsonwebtoken";
import { AccessDeniedByToken, InvalidToken } from "../errors/auth.errors.js";

export const verifyUserToken = (req, res, next) => {
    try {
        // Buscamos el header de autorización que manda tu interceptor de Axios
        const authHeader = req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next(new AccessDeniedByToken());
        }

        // Extraemos solo el token
        const token = authHeader.split(" ")[1];

        // Verificamos que el token sea válido y no haya sido alterado (la misma que en auth.service)
        const secret = process.env.JWT_SECRET || "clave_secreta_para_desarrollo";
        const decoded = jwt.verify(token, secret);

        // Guardamos los datos decodificados en la request para todos los controllers
        req.user = decoded;

        // Si llega hasta aca esta all ok y pasa al controller
        next();
    } catch (error) {
        // Si el token fue modificado tira error
        return next(new InvalidToken());
    }
};