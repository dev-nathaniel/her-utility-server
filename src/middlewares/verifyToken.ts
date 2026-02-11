import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import type { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/response-helper.js';

dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

//verify token properly save user to request.user so you don't have to do 
// more in the actual service function

//when token fails refresh so return a status that
//is appropraite so you can identify it

const jwt_secret_key = process.env.SECRET_KEY!;
// console.log("JWT Secret Key:", jwt_secret_key);
const jwt_refresh_secret_key = process.env.REFRESH_SECRET_KEY!;

if (!jwt_secret_key || !jwt_refresh_secret_key) {
  throw new Error("Missing secret keys");
}

// Middleware to verify JWT token and user role
// Can be configured to require specific roles (admin, user, etc.)
export const verifyTokenAndRole = (requiredRole: 'user' | 'admin') => (request: Request, response: Response, next: NextFunction) => {
    const authToken = request.headers['authorization']
    if (!authToken) return sendError(response, 401, "No token provided");
    const token = authToken.split(" ")[1];
    if (token) {
    jwt.verify(token, jwt_secret_key, (error, decoded) => {
        console.log(error)
        if (error) return sendError(response, 401, "Failed to authenticate token");
        request.user = decoded;
        // [TRIAL AND ERROR] - Debug logging
        // console.log(decoded.id, 'decoded')
        // console.log(request.userId, 'request')
        // request.userRole = decoded.role;
        if (requiredRole && (request?.user as any)?.role !== requiredRole) {
            return sendError(response, 403, "Insufficient permissions");
        }
        next();
    });
}
};

export const verifyToken = (request: Request, response: Response, next: NextFunction) => {
    const authHeader = request.headers['authorization']
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        if (token) {
        jwt.verify(token, jwt_secret_key, (err, user) => {
            if (err) {
                sendError(response, 401, "Token is not valid!");
                return
            }
            request.user = user;
            next()
        })
    }
    } else {
         sendError(response, 401, "You are not authenticated!");
    }
}

export const verifyTokenAndAuthorization = (request: Request, response: Response, next: NextFunction) => {
    verifyToken(request, response, () => {
        if ((request?.user as any)?.userId === request.params.id || (request?.user as any)?.role === 'admin') {
            next();
        } else {
            sendError(response, 403, "You are not authorized!");
        }
    })
}

export const verifyTokenAndAdmin = (request: Request, response: Response, next: NextFunction) => {
    verifyToken(request, response, () => {
        if((request?.user as any)?.role === 'admin') {
            next();
        } else {
            sendError(response, 403, "You are not authorized!");
        }
    })
}