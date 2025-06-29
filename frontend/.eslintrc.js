module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // 開発中は warning、CI/本番では警告レベル（エラーではない）
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['error'] }],  // console.errorは許可
    // React固有のルール
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-no-target-blank': 'error'
  }
}; 