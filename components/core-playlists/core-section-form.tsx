"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CoreSectionFormProps {
  onSubmit: (data: {
    title: string
    description?: string
    type: "base" | "loop"
    minSelectMedia?: number
    maxSelectMedia?: number
  }) => void
  defaultValues?: {
    title?: string
    description?: string
    type?: "base" | "loop"
    minSelectMedia?: number
    maxSelectMedia?: number
  }
}

export function CoreSectionForm({ onSubmit, defaultValues }: CoreSectionFormProps) {
  const [title, setTitle] = useState(defaultValues?.title || "")
  const [description, setDescription] = useState(defaultValues?.description || "")
  const [type, setType] = useState<"base" | "loop">(defaultValues?.type || "base")
  const [minSelectMedia, setMinSelectMedia] = useState(defaultValues?.minSelectMedia || 1)
  const [maxSelectMedia, setMaxSelectMedia] = useState(defaultValues?.maxSelectMedia || 1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description,
      type,
      minSelectMedia,
      maxSelectMedia,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="section-title">Section Title</Label>
        <Input
          id="section-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter section title"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="section-description">Description</Label>
        <Textarea
          id="section-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter section description"
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="section-type">Section Type</Label>
        <Select value={type} onValueChange={(value: "base" | "loop") => setType(value)}>
          <SelectTrigger id="section-type">
            <SelectValue placeholder="Select section type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="base">Base (plays once)</SelectItem>
            <SelectItem value="loop">Loop (repeats)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min-select">Min Media</Label>
          <Input
            id="min-select"
            type="number"
            min={0}
            value={minSelectMedia}
            onChange={(e) => setMinSelectMedia(parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-select">Max Media</Label>
          <Input
            id="max-select"
            type="number"
            min={1}
            value={maxSelectMedia}
            onChange={(e) => setMaxSelectMedia(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>
      <Button type="submit" className="w-full">
        Save Section
      </Button>
    </form>
  )
}
