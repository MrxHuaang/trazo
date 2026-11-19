module.exports = function (api) {
  api.cache(true);
  return {
    // jsxImportSource de nativewind es lo que hace que className funcione en los componentes de RN.
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
