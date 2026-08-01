import type { UserRole } from './index';
import type { ReactNode } from 'react';

export interface AuthUser {
    id: string | number;
    name: string;
    full_name?: string;
    email: string;
    role: UserRole;
    email_verified_at: string | null;
    is_active?: boolean;
    department?: string;
    phone?: string;
    address?: string;
    avatar?: string;
}

interface SharedHimlayanPageProps {
    flash?: {
        success?: string;
        error?: string;
    };
    auth: {
        user: AuthUser | null;
    };
    errors?: Record<string, string>;
}

declare module '@inertiajs/core' {
    export interface PageProps {
        [key: string]: unknown;
        flash?: SharedHimlayanPageProps['flash'];
        auth: SharedHimlayanPageProps['auth'];
        errors?: SharedHimlayanPageProps['errors'];
    }
}

declare module '@inertiajs/react' {
    export interface PageProps extends SharedHimlayanPageProps {
        [key: string]: unknown;
    }
}

declare module 'react' {
    interface FunctionComponent<P = {}> {
        layout?: (page: ReactNode) => ReactNode;
    }
}
