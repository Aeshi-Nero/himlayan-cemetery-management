export type ZiggyParams = Record<string, unknown> | string | number | undefined;

export interface RouteHelpers {
    current(name?: string, params?: Record<string, unknown>): boolean;
}

export interface RouteFunction {
    (name: string, params?: ZiggyParams, absolute?: boolean): string;
    (name?: string, params?: undefined): RouteHelpers;
}

declare global {
    const route: RouteFunction;
}

declare module 'ziggy-js' {
    export function route(
        name?: string,
        params?: Record<string, unknown> | string | number | undefined,
        absolute?: boolean,
    ): string;
}
