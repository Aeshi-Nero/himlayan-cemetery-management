import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**', '**/vendor/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        window: 'readonly',
        console: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Date: 'readonly',
        Image: 'readonly',
        URL: 'readonly',
        process: 'readonly',
        NodeJS: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-undef': 'off',
    },
  },
  {
    files: [
      'resources/js/Pages/Engineer/EngineerWorkspacePage.tsx',
      'resources/js/Pages/Public/MemorialMapPage.tsx',
      'resources/js/Pages/Admin/MapEditorPage.tsx',
      'resources/js/Pages/Public/LotDetailPage.tsx',
    ],
    rules: {
      // Focus this pass on the geometry-constant guard only.
      'no-useless-assignment': 'off',
      'prefer-const': 'off',
      'no-useless-escape': 'off',
      'react-hooks/exhaustive-deps': 'off',
      // Disallow hard-coded geometry literals that belong in ../constants/geo.ts.
      // Matches the default Himlayan coordinates & fly/duplicate/snap numeric literals.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=14.672], Literal[value=14.671], Literal[value=121.041], Literal[value=121.0415], Literal[value=0.0012], Literal[value=0.003]',
          message: 'Use the named constants from @/constants/geo (e.g. FALLBACK_PLOT_LAT/LNG) instead of raw map coordinates.',
        },
      ],
    },
  }
);