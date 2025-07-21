import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { Layout } from "@/components/Layout"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useUserRole } from "@/hooks/useUserRole"

const frameKeys = ["brand", "colour", "material", "shape", "rim"] as const

const formSchema = z.object({
  brand: z.string(),
  colour: z.string(),
  material: z.string(),
  shape: z.string(),
  rim: z.string(),
  visionType: z.string(),
  lensColour: z.string(),
  lensThickness: z.string(),
  gender: z.string(),
  size: z.string(),
  lensWidth: z.number(),
  bridgeWidth: z.number(),
  templeLength: z.number(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  supplierCode: z.string(),
  costPrice: z.number().min(0, "Cost price must be positive"),
  sellingPrice: z.number().min(0, "Selling price must be positive"),
  images: z.any().optional(),
})

type FormData = z.infer<typeof formSchema>

function calculateSizeCategory(width: number): string {
  if (width < 42) return "Extra-small"
  if (width >= 42 && width <= 48) return "Small"
  if (width >= 49 && width <= 52) return "Medium"
  if (width >= 53 && width <= 58) return "Large"
  return "Extra-large"
}

export default function AddFrame() {
  const { toast } = useToast()
  const { hasPermission } = useUserRole()
  const { register, handleSubmit, setValue, control, watch, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand: "",
      colour: "",
      material: "",
      shape: "",
      rim: "",
      visionType: "",
      lensColour: "",
      lensThickness: "",
      gender: "",
      size: "",
      lensWidth: 0,
      bridgeWidth: 0,
      templeLength: 0,
      quantity: 1,
      supplierCode: "",
      costPrice: 0,
      sellingPrice: 0,
      images: undefined,
    },
  })

  const lensWidth = watch("lensWidth")

  useEffect(() => {
    const autoSize = calculateSizeCategory(lensWidth)
    setValue("size", autoSize)
  }, [lensWidth, setValue])

  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (data: FormData) => {
    if (!hasPermission('create')) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create frames.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    console.log('Form submission started with data:', data)

    try {
      // Prepare frame data for database
      const frameData = {
        brand: data.brand,
        colour: data.colour,
        material: data.material,
        shape: data.shape,
        rim: data.rim,
        vision_type: data.visionType,
        lens_colour: data.lensColour,
        lens_thickness: data.lensThickness,
        gender: data.gender,
        size: data.size,
        lens_width: data.lensWidth,
        bridge_width: data.bridgeWidth,
        temple_length: data.templeLength,
        quantity: data.quantity,
        supplier_code: data.supplierCode,
        cost_price: data.costPrice,
        selling_price: data.sellingPrice,
        images: imageFiles.length > 0 ? imageFiles.map(file => file.name) : null,
      }

      console.log('Inserting frame data:', frameData)

      const { data: insertedFrame, error } = await supabase
        .from('frames')
        .insert(frameData)
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      console.log('Frame inserted successfully:', insertedFrame)

      toast({
        title: "Success",
        description: "Frame added to inventory successfully!",
      })

      // Reset form
      reset()
      setPreviewImages([])
      setImageFiles([])
    } catch (error) {
      console.error('Error adding frame:', error)
      toast({
        title: "Error",
        description: "Failed to add frame to inventory. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const frameOptions = {
    brand: [
      "Ray-Ban", "Oakley", "Gucci", "Versace", "Prada", "Armani Exchange", "Michael Kors",
      "Burberry", "Coach", "Dolce & Gabbana", "Tiffany & Co.", "Tom Ford", "Vogue Eyewear",
      "Persol", "Lacoste", "Boss", "Carrera", "Calvin Klein", "Fendi", "Nike", "Generic"
    ],
    colour: [
      "Black", "Brown", "Tortoise", "Clear", "Blue", "Red", "Green", "Pink", 
      "Purple", "Gray", "White", "Gold", "Silver", "Rose Gold", "Navy", 
      "Burgundy", "Orange", "Yellow", "Teal", "Olive"
    ],
    material: ["Metal", "Plastic", "Titanium"],
    shape: ["Round", "Square", "Cat Eye"],
    rim: ["Full Rim", "Semi Rimless", "Rimless"],
  }

  const genderOptions = ["Men", "Women", "Unisex"]

  const handleImageDelete = (index: number) => {
    const updatedImages = [...imageFiles]
    const updatedPreviews = [...previewImages]
    updatedImages.splice(index, 1)
    updatedPreviews.splice(index, 1)
    setImageFiles(updatedImages)
    setPreviewImages(updatedPreviews)
    setValue("images", updatedImages)
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Frame</h1>
          <p className="text-gray-600">Add a new frame to your inventory</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Frame Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Frame Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {Object.entries(frameOptions).map(([key, values]) => {
                const selected = watch(key as keyof FormData)
                return (
                  <div key={key}>
                    <label className="block mb-1 capitalize">{key}</label>
                    <Controller
                      name={key as keyof FormData}
                      control={control}
                      render={({ field }) => (
                        <>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${key}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {[...values, "Other"].map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selected === "Other" && (
                            <Input
                              className="mt-2"
                              placeholder={`Enter custom ${key}`}
                              onChange={(e) => setValue(key as keyof FormData, e.target.value)}
                            />
                          )}
                        </>
                      )}
                    />
                  </div>
                )
              })}

              <div>
                <label className="block mb-1 capitalize">Gender</label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Size and Media Card */}
          <Card>
            <CardHeader>
              <CardTitle>Size and Media</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Lens Width (mm)</label>
                <Input type="number" {...register("lensWidth", { valueAsNumber: true })} placeholder="Lens Width" />
              </div>
              <div>
                <label className="block mb-1">Bridge Width (mm)</label>
                <Input type="number" {...register("bridgeWidth", { valueAsNumber: true })} placeholder="Bridge Width" />
              </div>
              <div>
                <label className="block mb-1">Temple Length (mm)</label>
                <Input type="number" {...register("templeLength", { valueAsNumber: true })} placeholder="Temple Length" />
              </div>
              <div>
                <label className="block mb-1">Size</label>
                <Input value={watch("size")} readOnly disabled />
              </div>
              <div className="col-span-2">
                <label className="block mb-1">Images</label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = e.target.files
                    if (files) {
                      const fileArray = Array.from(files)
                      const newPreviews = fileArray.map(file => URL.createObjectURL(file))
                      const allFiles = [...imageFiles, ...fileArray]
                      const allPreviews = [...previewImages, ...newPreviews]
                      setImageFiles(allFiles)
                      setPreviewImages(allPreviews)
                      setValue("images", allFiles)
                    }
                  }}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {previewImages.map((src, idx) => (
                    <div key={idx} className="relative group">
                      <img src={src} alt={`upload-${idx}`} className="h-20 w-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => handleImageDelete(idx)}
                        className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-full px-1 text-xs hidden group-hover:block"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Costings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Costings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block mb-1">Supplier Code</label>
                <Input {...register("supplierCode")} placeholder="Enter supplier code" />
              </div>
              <div>
                <label className="block mb-1">Cost Price ($)</label>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0"
                  {...register("costPrice", { valueAsNumber: true })} 
                  placeholder="0.00" 
                />
              </div>
              <div>
                <label className="block mb-1">Selling Price ($)</label>
                <Input 
                  type="number" 
                  step="0.01"
                  min="0"
                  {...register("sellingPrice", { valueAsNumber: true })} 
                  placeholder="0.00" 
                />
              </div>
            </CardContent>
          </Card>

          {/* Inventory Card */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block mb-1">Quantity</label>
                <Input 
                  type="number" 
                  min="1"
                  {...register("quantity", { valueAsNumber: true })} 
                  placeholder="Enter quantity" 
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Adding Frame..." : "Add Frame"}
          </Button>
        </form>
      </div>
    </Layout>
  )
}
