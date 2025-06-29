module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // 開発中は warning、本番は error
    'no-unused-vars': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // React固有のルール
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-no-target-blank': 'error'
  }
}; 