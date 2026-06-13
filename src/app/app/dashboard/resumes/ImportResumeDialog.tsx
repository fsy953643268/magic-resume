import React, { useState } from "react";
import { useTranslations } from "@/i18n/compat/client";
import { Braces, Loader2, Sparkles, Settings2 } from "lucide-react";
import { PdfIcon } from "@/components/shared/icons/PdfIcon";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AIModelType } from "@/config/ai";

interface ProviderOption {
  id: AIModelType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const providerOptions: ProviderOption[] = [
  { id: "gemini", name: "Google Gemini", icon: Sparkles, color: "text-amber-500", bgColor: "bg-amber-50 dark:bg-amber-950/50" },
  { id: "doubao", name: "豆包（Doubao）", icon: ({ className }) => <div className={cn("h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center", className)}>D</div>, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/50" },
  { id: "deepseek", name: "DeepSeek", icon: ({ className }) => <div className={cn("h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center", className)}>DS</div>, color: "text-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950/50" },
  { id: "openai", name: "OpenAI", icon: ({ className }) => <div className={cn("h-6 w-6 rounded-full bg-gray-500/20 flex items-center justify-center", className)}>OA</div>, color: "text-gray-600 dark:text-gray-400", bgColor: "bg-gray-50 dark:bg-gray-950/50" },
  { id: "custom", name: "自定义", icon: Settings2, color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-950/50" },
];

interface ImportResumeDialogProps {
  open: boolean;
  isImporting: boolean;
  onOpenChange: (open: boolean) => void;
  jsonFileInputRef: React.RefObject<HTMLInputElement>;
  pdfFileInputRef: React.RefObject<HTMLInputElement>;
  onJsonFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPdfFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onProviderSelect?: (provider: AIModelType) => void;
}

export const ImportResumeDialog = ({
  open,
  isImporting,
  onOpenChange,
  jsonFileInputRef,
  pdfFileInputRef,
  onJsonFileChange,
  onPdfFileChange,
  onProviderSelect,
}: ImportResumeDialogProps) => {
  const t = useTranslations();
  const [selectedProvider, setSelectedProvider] = useState<AIModelType | null>(null);

  const handleProviderClick = (provider: AIModelType) => {
    setSelectedProvider(provider);
    onProviderSelect?.(provider);
  };

  return (
    <>
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={onJsonFileChange}
      />
      <input
        ref={pdfFileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={onPdfFileChange}
      />

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (isImporting) return;
          onOpenChange(nextOpen);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{t("dashboard.resumes.importDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.resumes.importDialog.selectProvider")}
            </DialogDescription>
          </DialogHeader>

          {/* Provider Selection */}
          <div className="grid grid-cols-2 gap-2 py-2">
            {providerOptions.map((provider) => {
              const Icon = provider.icon;
              const isSelected = selectedProvider === provider.id;
              return (
                <button
                  key={provider.id}
                  type="button"
                  disabled={isImporting}
                  onClick={() => handleProviderClick(provider.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all duration-200",
                    "hover:border-primary/50 hover:bg-accent/50",
                    "active:scale-[0.98]",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border/50 bg-card"
                  )}
                >
                  <div className={cn("shrink-0 rounded-md p-1", provider.bgColor)}>
                    <Icon className={cn("h-4 w-4", provider.color)} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{provider.name}</span>
                  {isSelected && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 py-2">
            <button
              type="button"
              disabled={isImporting}
              className={cn(
                "group relative flex w-full items-start gap-4 rounded-xl border border-border/50 bg-card p-4 text-left transition-all duration-200",
                "hover:border-primary/50 hover:bg-accent/50 hover:shadow-md",
                "active:scale-[0.98]",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              )}
              onClick={() => jsonFileInputRef.current?.click()}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 transition-colors group-hover:bg-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400">
                <Braces className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-foreground leading-none">
                  {t("dashboard.resumes.importDialog.jsonTitle")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("dashboard.resumes.importDialog.jsonDescription")}
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled={isImporting}
              className={cn(
                "group relative flex w-full items-start gap-4 rounded-xl border border-border/50 bg-card p-4 text-left transition-all duration-200",
                "hover:border-primary/50 hover:bg-accent/50 hover:shadow-md",
                "active:scale-[0.98]",
                "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
              )}
              onClick={() => pdfFileInputRef.current?.click()}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 transition-colors group-hover:bg-red-500/20 dark:bg-red-500/20 dark:text-red-400">
                <PdfIcon className="h-6 w-6" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-foreground leading-none">
                  {t("dashboard.resumes.importDialog.pdfTitle")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("dashboard.resumes.importDialog.pdfDescription")}
                </p>
              </div>
            </button>
          </div>

          {isImporting && (
            <DialogFooter className="sm:justify-start">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {t("dashboard.resumes.importDialog.importing")}
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
