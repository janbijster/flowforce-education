import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { router } from "./Router";
import "./lib/i18n"; // Initialize i18n

export default function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <AuthProvider>
                    <RouterProvider router={router} />
                </AuthProvider>
            </LanguageProvider>
        </ThemeProvider>
    )
}
