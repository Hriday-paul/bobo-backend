import express, { NextFunction, Request, Response } from 'express';
import { authRouts } from './modules/auth/auth.rout';
import { packageRouts } from './modules/package/package.rout';
import { subscriptionRoutes } from './modules/subscription/subscription.route';
import { paymentsRoutes } from './modules/payments/payments.route';
import { commentRouts } from './modules/access_comments/access_comments.rout';
import { userRoutes } from './modules/user/user.rout';

const router = express.Router();

const moduleRoutes = [
    {
        path: '/auth',
        route: authRouts,
    },
    {
        path: '/package',
        route: packageRouts,
    },
    {
        path: '/subscriptions',
        route: subscriptionRoutes,
    },
    {
        path: '/payments',
        route: paymentsRoutes,
    },
    {
        path: '/comments',
        route: commentRouts,
    },
    {
        path: '/users',
        route: userRoutes,
    }
];
moduleRoutes.forEach(route => router.use(route.path, route.route));

export default router;