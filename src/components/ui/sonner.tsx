import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast dashboard-neon-surface group-[.toaster]:bg-black/85 group-[.toaster]:text-cyan-50 group-[.toaster]:border-cyan-400/25 group-[.toaster]:rounded-2xl group-[.toaster]:shadow-[0_0_35px_rgba(34,211,238,0.18)]",
          title: "group-[.toast]:text-white group-[.toast]:font-semibold",
          description: "group-[.toast]:text-white/72",
          actionButton: "group-[.toast]:bg-cyan-400/20 group-[.toast]:text-cyan-50 group-[.toast]:border group-[.toast]:border-cyan-300/35",
          cancelButton: "group-[.toast]:bg-white/5 group-[.toast]:text-white/70 group-[.toast]:border group-[.toast]:border-white/10",
          closeButton: "group-[.toast]:bg-white/5 group-[.toast]:border group-[.toast]:border-white/10 group-[.toast]:text-white/70 hover:group-[.toast]:bg-white/10",
          success: "group-[.toast]:border-emerald-400/35 group-[.toast]:shadow-[0_0_30px_rgba(16,185,129,0.18)]",
          error: "group-[.toast]:border-rose-400/40 group-[.toast]:bg-[linear-gradient(145deg,rgba(60,10,18,0.92),rgba(38,8,15,0.9))] group-[.toast]:shadow-[0_0_34px_rgba(244,63,94,0.22)]",
          warning: "group-[.toast]:border-amber-400/40 group-[.toast]:shadow-[0_0_34px_rgba(251,191,36,0.18)]",
          info: "group-[.toast]:border-cyan-400/35 group-[.toast]:shadow-[0_0_34px_rgba(34,211,238,0.18)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
