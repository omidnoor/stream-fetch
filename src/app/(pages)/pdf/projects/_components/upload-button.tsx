"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function UploadButton() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file")
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", file.name.replace(".pdf", ""))

      const response = await fetch("/api/pdf/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        toast.success("PDF uploaded successfully!")
        router.push(`/pdf?projectId=${data.data.id}`)
      } else {
        toast.error(data.error || "Failed to upload PDF")
      }
    } catch (error) {
      console.error("Upload failed:", error)
      toast.error("Failed to upload PDF")
    } finally {
      setUploading(false)
      // Reset input
      event.target.value = ""
    }
  }

  return (
    <label htmlFor="pdf-upload">
      <Button
        disabled={uploading}
        className="bg-primary hover:bg-primary/90"
        asChild
      >
        <span className="cursor-pointer">
          <Upload className="h-5 w-5 mr-2" />
          {uploading ? "Uploading..." : "Upload PDF"}
        </span>
      </Button>
      <input
        id="pdf-upload"
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleUpload}
        className="hidden"
      />
    </label>
  )
}
