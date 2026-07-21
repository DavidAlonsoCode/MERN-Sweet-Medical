import { jest } from "@jest/globals";
import AuthController from "../controllers/auth.controller.js";

describe("AuthController UNIT", () => {
    let req, res, next;
    // We mock the singleton method
    const mockLogin = jest.fn();

    beforeAll(() => {
        // Mock the internal service inside the singleton
        AuthController.authService = { login: mockLogin };
    });

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
        mockLogin.mockClear();
    });

    describe("login", () => {
        test("debería devolver 400 si falta usuario o password", async () => {
            req.body = { usuario: "testuser" }; // falta password
            await AuthController.login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "Usuario y contraseña son requeridos." });
            expect(mockLogin).not.toHaveBeenCalled();
        });

        test("debería devolver 200 y el resultado del login si todo es exitoso", async () => {
            req.body = { usuario: "testuser", password: "password123" };
            const loginResult = { token: "token123", user: { nombre: "Test" } };
            mockLogin.mockResolvedValue(loginResult);

            await AuthController.login(req, res, next);

            expect(mockLogin).toHaveBeenCalledWith("testuser", "password123");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(loginResult);
        });

        test("debería devolver 401 si las credenciales son inválidas", async () => {
            req.body = { usuario: "testuser", password: "wrongpassword" };
            mockLogin.mockRejectedValue(new Error("Credenciales inválidas."));

            await AuthController.login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: "Credenciales inválidas." });
            expect(next).not.toHaveBeenCalled();
        });

        test("debería propagar otros errores al middleware de error (next)", async () => {
            req.body = { usuario: "testuser", password: "password123" };
            const dbError = new Error("Error en DB");
            mockLogin.mockRejectedValue(dbError);

            await AuthController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(dbError);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });
});
