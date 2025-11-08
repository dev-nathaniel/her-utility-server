import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import type { NextFunction, Request, Response } from 'express';
dotenv.config();

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

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
    // [TRIAL AND ERROR] - Debug logging
    // console.log(token)
    if (!authToken) return response.status(403).json({ message: "No token provided" });
    const token = authToken.split(" ")[1];
    if (token) {
    jwt.verify(token, jwt_secret_key, (error, decoded) => {
        console.log(error)
        if (error) return response.status(500).json({ message: "Failed to authenticate token" });
        request.user = decoded;
        // [TRIAL AND ERROR] - Debug logging
        // console.log(decoded.id, 'decoded')
        // console.log(request.userId, 'request')
        // request.userRole = decoded.role;
        if (requiredRole && (request?.user as any)?.role !== requiredRole) {
            return response.status(403).json({ message: "Insufficient permissions" });
        }
        next();
    });
}
};

export const verifyToken = (request: Request,response: Response,next: NextFunction)=>{
    const authHeader = request.headers['authorization']
    if(authHeader){
        const token = authHeader.split(" ")[1];
        if (token) {
        jwt.verify(token, jwt_secret_key, (err,user)=>{
            if(err) {
                response.status(403).json({message: "Token is not valid!"});
                return
            }
            request.user = user;
            next()
        })
    }
    }else{
         response.status(401).json({message: "You are not authenticated!"});
    }
}

export const verifyTokenAndAuthorization = (request: Request,response: Response,next: NextFunction)=>{
    verifyToken(request,response,()=>{
        if ((request?.user as any)?.userId === request.params.id || (request?.user as any)?.role === 'admin') {
            next();
        } else {
            response.status(403).json({message: "You are not authorized!"});
        }
    })
}

export const verifyTokenAndAdmin = (request: Request,response: Response,next: NextFunction)=>{
    verifyToken(request,response,()=>{
        if((request?.user as any)?.role === 'admin') {
            next();
        } else {
            response.status(403).json({message: "You are not authorized!"});
        }
    })
}