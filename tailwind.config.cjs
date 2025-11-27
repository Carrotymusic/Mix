```js
// tailwind.config.cjs - minimal tailwind config. Set content paths to match your sources.
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,html}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```