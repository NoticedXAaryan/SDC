"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export const HueThemeContext = React.createContext<{
  hueTheme: string;
  setHueTheme: (theme: string) => void;
}>({
  hueTheme: "butter",
  setHueTheme: () => {},
});

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [hueTheme, setHueThemeState] = React.useState("butter");

  React.useEffect(() => {
    const saved = localStorage.getItem("app-hue-theme");
    if (saved) {
      setHueThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "butter");
    }
  }, []);

  const setHueTheme = React.useCallback((theme: string) => {
    setHueThemeState(theme);
    localStorage.setItem("app-hue-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return (
    <HueThemeContext.Provider value={{ hueTheme, setHueTheme }}>
      <NextThemesProvider {...props}>{children}</NextThemesProvider>
    </HueThemeContext.Provider>
  );
}
