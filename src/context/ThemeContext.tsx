import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("salesview_theme") as Theme) ?? "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("salesview_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      <style>{`
        .theme-switch {
          display: block;
          --width-of-switch: 3.5em;
          --height-of-switch: 2em;
          --size-of-icon: 1.4em;
          --slider-offset: 0.3em;
          position: relative;
          width: var(--width-of-switch);
          height: var(--height-of-switch);
          cursor: pointer;
        }
        .theme-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .theme-slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #f4f4f5;
          transition: .4s;
          border-radius: 30px;
        }
        .theme-slider:before {
          position: absolute;
          content: "";
          height: var(--size-of-icon, 1.4em);
          width: var(--size-of-icon, 1.4em);
          border-radius: 20px;
          left: var(--slider-offset, 0.3em);
          top: 50%;
          transform: translateY(-50%);
          background: linear-gradient(40deg, #ff0080, #ff8c00 70%);
          transition: .4s;
        }
        .theme-switch input:checked + .theme-slider {
          background-color: #303136;
        }
        .theme-switch input:checked + .theme-slider:before {
          left: calc(100% - (var(--size-of-icon, 1.4em) + var(--slider-offset, 0.3em)));
          background: #303136;
          box-shadow: inset -3px -2px 5px -2px #8983f7, inset -10px -4px 0 0 #a3dafb;
        }
      `}</style>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/* Componente do switch — importar onde precisar */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <label className="theme-switch" title={theme === "dark" ? "Mudar para claro" : "Mudar para escuro"}>
      <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
      <span className="theme-slider" />
    </label>
  );
}