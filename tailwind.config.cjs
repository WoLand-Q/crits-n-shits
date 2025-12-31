/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./index.html", "./src/**/*.{js,ts}"],
    theme: {
        extend: {
            fontFamily: {
                display: ["Cinzel", "ui-serif", "serif"],
                sans: ["Inter", "ui-sans-serif", "system-ui"],
            },
        },
    },
    plugins: [],
};