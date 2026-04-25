/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            colors: {
                brand: {
                    light: '#f9fafb', // gray-50
                    dark: '#1f2937',  // gray-800
                    card: '#ffffff',  // white
                    primary: '#f97316', // orange-500
                    primaryDark: '#ea580c', // orange-600
                    gold: '#eab308', // yellow-500
                    text: '#1f2937', // gray-800
                    muted: '#9ca3af' // gray-400
                }
            }
        },
    },
    plugins: [],
};