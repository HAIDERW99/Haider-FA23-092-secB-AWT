import { useRef, useState } from 'react'
import { Upload, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export function PaymentUploadZone({ onFileSelect, accept = 'image/*', maxSizeMb = 5, className }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [error, setError] = useState(null)

  const handleFile = (file) => {
    setError(null)
    if (!file) return
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File must be under ${maxSizeMb}MB`)
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)
    onFileSelect?.(file)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <Label>Payment screenshot</Label>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleFile(e.dataTransfer.files?.[0])
        }}
        className={cn(
          'flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-6 transition-colors hover:border-primary/50 hover:bg-accent/50'
        )}
      >
        {preview ? (
          <img src={preview} alt="Payment preview" className="max-h-40 rounded-md object-contain" />
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Drag & drop or click to upload</p>
            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to {maxSizeMb}MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {fileName && !error && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          {fileName}
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {preview && (
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Change file
        </Button>
      )}
    </div>
  )
}
