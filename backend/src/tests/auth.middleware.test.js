import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { verifyUserToken } from "../middlewares/auth.middleware.js";
import { AccessDeniedByToken, InvalidToken } from "../errors/auth.errors.js";

describe("Auth Middleware UNIT", () => {
    let req, res, next;

    beforeEach(() => {
        req = { header: jest.fn() };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    describe("verifyUserToken", () => {
        test("debería lanzar AccessDeniedByToken si no hay header de autorizacion", () => {
            req.header.mockReturnValue(null);
            verifyUserToken(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AccessDeniedByToken));
        });

        test("debería lanzar AccessDeniedByToken si el header no empieza con Bearer", () => {
            req.header.mockReturnValue("Basic 123456");
            verifyUserToken(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AccessDeniedByToken));
        });

        test("debería lanzar InvalidToken si jwt.verify falla", () => {
            req.header.mockReturnValue("Bearer token_falso");
            jest.spyOn(jwt, "verify").mockImplementation(() => { throw new Error("Token invalido"); });

            verifyUserToken(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(InvalidToken));
            jwt.verify.mockRestore();
        });

        test("debería llamar a next() y settear req.user si el token es válido", () => {
            req.header.mockReturnValue("Bearer token_valido");
            const mockUser = { rol: "PACIENTE", identificador: "123" };
            jest.spyOn(jwt, "verify").mockImplementation(() => mockUser);

            verifyUserToken(req, res, next);

            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalledWith();
            expect(next).toHaveBeenCalledTimes(1);

            jwt.verify.mockRestore();
        });
    });
});
