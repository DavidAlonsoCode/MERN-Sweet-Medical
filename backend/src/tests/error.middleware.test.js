import { jest } from "@jest/globals";
import errorHandler from "../middlewares/error.handler.middleware.js";
import { AuthError } from "../errors/auth.errors.js";
import { MedicoError } from "../errors/medico.errors.js";

describe("Error Handler Middleware UNIT", () => {
    let req, res, next;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    test("debería manejar SyntaxError devolviendo 400", () => {
        const error = new SyntaxError("Unexpected token");
        error.body = {};

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message: "Error de formato en el JSON",
            error: "Unexpected token"
        });
    });

    test("debería manejar MedicoError devolviendo el status del error", () => {
        const error = { status: 404, message: "Medico no encontrado" };
        Object.setPrototypeOf(error, MedicoError.prototype);

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: "Medico no encontrado" });
    });

    test("debería manejar AuthError delegando a su propio status y message", () => {
        const error = new AuthError(401, "No tienes permisos.");

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: "No tienes permisos."
        });
    });

    test("debería manejar errores genéricos devolviendo 500", () => {
        const error = new Error("Error genérico de BD");
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Error interno del servidor",
            error: "Error genérico de BD"
        });

        consoleSpy.mockRestore();
    });
});
