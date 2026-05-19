import { useRef, useState } from "react";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, Link2 } from "lucide-react";

/**
 * Standardized image upload + URL fallback control.
 *
 * Default UX: a single "Upload image" button. Click → file picker → upload
 * via /api/uploads/request-url (presigned S3/R2), and `onChange` fires with
 * the resulting public URL.
 *
 * Power-user fallback: a small "Paste URL instead" toggle reveals a URL
 * input for cases where the image is already hosted elsewhere.
 *
 * If `value` is set, a thumbnail preview + remove button replaces the
 * action area.
 *
 * Use anywhere that previously asked the user for an image URL.
 */
export function ImageUploadField({
  value,
  onChange,
  accept = "image/*",
  label,
  helpText,
  // Alias for helpText, used by older call sites.
  aspectHint,
  testIdPrefix,
  className,
  // Optional: when the host wants a big square/landscape dropzone preview
  // (e.g. store logo, hero banner) instead of the compact thumbnail row.
  previewClass,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  accept?: string;
  label?: string;
  helpText?: string;
  aspectHint?: string;
  testIdPrefix?: string;
  className?: string;
  previewClass?: string;
}) {
  const effectiveHelp = helpText ?? aspectHint;
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (resp) => {
      onChange(resp.objectPath);
      toast({ title: "Image uploaded" });
    },
    onError: (err) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const handlePickFile = () => fileRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Pick an image file", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 20 MB.", variant: "destructive" });
      return;
    }
    await uploadFile(file);
    // Reset so the same file can be picked again later.
    if (fileRef.current) fileRef.current.value = "";
  };

  const applyUrlDraft = () => {
    const url = urlDraft.trim();
    if (!url) return;
    onChange(url);
    setUrlDraft("");
    setShowUrlInput(false);
  };

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      {label && <p className="text-sm font-medium">{label}</p>}

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        data-testid={testIdPrefix ? `${testIdPrefix}-file-input` : "image-upload-file-input"}
      />

      {value && previewClass ? (
        // Big-preview mode (logo, hero banner, etc.)
        <div className="relative group">
          <div className={`overflow-hidden rounded-md border ${previewClass}`}>
            <img
              src={value}
              alt={label || "Preview"}
              className="w-full h-full object-cover"
              data-testid={testIdPrefix ? `${testIdPrefix}-preview` : "image-upload-preview"}
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={handlePickFile}
              disabled={isUploading}
              data-testid={testIdPrefix ? `${testIdPrefix}-replace` : "image-upload-replace"}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => onChange(null)}
              disabled={isUploading}
              data-testid={testIdPrefix ? `${testIdPrefix}-remove` : "image-upload-remove"}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : value ? (
        <div className="flex items-center gap-3 rounded-md border p-2">
          <img
            src={value}
            alt="Preview"
            className="h-14 w-14 rounded-md object-cover bg-muted shrink-0"
            data-testid={testIdPrefix ? `${testIdPrefix}-preview` : "image-upload-preview"}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate" title={value}>{value}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePickFile}
            disabled={isUploading}
            data-testid={testIdPrefix ? `${testIdPrefix}-replace` : "image-upload-replace"}
          >
            {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Replace"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(null)}
            disabled={isUploading}
            data-testid={testIdPrefix ? `${testIdPrefix}-remove` : "image-upload-remove"}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : previewClass ? (
        // Big-preview empty state (clickable dropzone)
        <div
          role="button"
          tabIndex={0}
          onClick={handlePickFile}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handlePickFile(); } }}
          className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-muted-foreground/40 transition-colors ${previewClass}`}
          data-testid={testIdPrefix ? `${testIdPrefix}-upload` : "image-upload-dropzone"}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
              <span className="text-xs text-muted-foreground">Uploading {progress > 0 ? `${progress}%` : "…"}</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Click to upload</span>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePickFile}
            disabled={isUploading}
            className="w-full justify-center"
            data-testid={testIdPrefix ? `${testIdPrefix}-upload` : "image-upload-button"}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading {progress > 0 ? `${progress}%` : "…"}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload image
              </>
            )}
          </Button>

          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              data-testid={testIdPrefix ? `${testIdPrefix}-show-url` : "image-upload-show-url"}
            >
              <Link2 className="h-3 w-3" />
              Or paste a URL instead
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyUrlDraft(); } }}
                data-testid={testIdPrefix ? `${testIdPrefix}-url-input` : "image-upload-url-input"}
              />
              <Button type="button" size="sm" onClick={applyUrlDraft} disabled={!urlDraft.trim()}>
                Use
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => { setShowUrlInput(false); setUrlDraft(""); }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {effectiveHelp && <p className="text-xs text-muted-foreground">{effectiveHelp}</p>}
    </div>
  );
}
