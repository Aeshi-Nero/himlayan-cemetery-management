/// <reference types="vite/client" />

interface Window {
    axios: typeof import('axios').default;
}

declare module '*.jpg' {
    const value: string;
    export default value;
}

declare module '*.jpeg' {
    const value: string;
    export default value;
}

declare module '*.png' {
    const value: string;
    export default value;
}

declare module '*.svg' {
    const value: string;
    export default value;
}

declare module '*.css' {
    const value: string;
    export default value;
}
