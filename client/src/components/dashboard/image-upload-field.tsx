import { useRef } from "react";
import { useUpload } from "@/hooks/use-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";

export function ImageUploadField({
  label,
  value,
  onChange,
  aspectHint,
  previewClass,
  testIdPrefix,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspectHint: string;
  previewClass: string;
  testIdPrefix: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => {
      onChange(res.objectPath);
    },
    onError: () => {},
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    await uploadFile(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{aspectHint}</p>

      {value ? (
        <div className="relative group">
          <div className={`overflow-hidden rounded-md border border-border ${previewClass}`}>
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
              data-testid={`img-${testIdPrefix}-preview`}
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              data-testid={`button-${testIdPrefix}-replace`}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onChange("")}
              data-testid={`button-${testIdPrefix}-remove`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !isUploading && fileRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
          className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 cursor-pointer hover-elevate ${previewClass}`}
          data-testid={`button-${testIdPrefix}-upload`}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
          ) : (
            <>
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Click to upload</span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        data-testid={`input-${testIdPrefix}-file`}
      />

      <Input
        placeholder="Or paste an image URL"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`input-${testIdPrefix}-url`}
      />
    </div>
  );
}
