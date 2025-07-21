
import React, { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Trash2, Pencil } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface Frame {
  id: string;
  code: number;
  brand: string;
  colour: string;
  material: string;
  shape: string;
  rim: string;
  vision_type: string | null;
  lens_colour: string | null;
  lens_thickness: string | null;
  gender: string | null;
  size: string | null;
  lens_width: number | null;
  bridge_width: number | null;
  temple_length: number | null;
  quantity: number;
  images: any;
  supplier_code: string | null;
  cost_price: number | null;
  selling_price: number | null;
  created_at: string;
  updated_at: string;
}

export default function FrameList() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [editFrame, setEditFrame] = useState<Frame | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Frame>>({});
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const { hasPermission } = useUserRole();

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
  };

  const genderOptions = ["Men", "Women", "Unisex"];

  useEffect(() => {
    fetchFrames();
  }, []);

  const fetchFrames = async () => {
    try {
      console.log("Fetching frames...");
      const { data, error } = await supabase
        .from('frames')
        .select('*')
        .order('code', { ascending: true });

      console.log("Frames fetch result:", { data, error });

      if (error) {
        console.error("Error fetching frames:", error);
        throw error;
      }
      
      setFrames(data || []);
      console.log("Frames set successfully:", data?.length);
    } catch (error) {
      console.error('Error fetching frames:', error);
      toast({
        title: "Error",
        description: "Failed to fetch frames from inventory.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (frameId: string) => {
    if (!hasPermission('delete')) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete frames.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('frames')
        .delete()
        .eq('id', frameId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Frame deleted successfully.",
      });

      fetchFrames();
    } catch (error) {
      console.error('Error deleting frame:', error);
      toast({
        title: "Error",
        description: "Failed to delete frame.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (frame: Frame) => {
    console.log("Opening edit dialog for frame:", frame);
    setEditFrame(frame);
    setEditFormData({
      brand: frame.brand,
      colour: frame.colour,
      material: frame.material,
      shape: frame.shape,
      rim: frame.rim,
      vision_type: frame.vision_type || "",
      lens_colour: frame.lens_colour || "",
      lens_thickness: frame.lens_thickness || "",
      gender: frame.gender || "",
      size: frame.size || "",
      lens_width: frame.lens_width || 0,
      bridge_width: frame.bridge_width || 0,
      temple_length: frame.temple_length || 0,
      quantity: frame.quantity,
      supplier_code: frame.supplier_code || "",
      cost_price: frame.cost_price || 0,
      selling_price: frame.selling_price || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!hasPermission('update')) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to update frames.",
        variant: "destructive",
      });
      return;
    }

    if (!editFrame) {
      console.error("No frame selected for editing");
      return;
    }

    try {
      console.log("Saving frame edit:", editFormData);
      
      const { error } = await supabase
        .from('frames')
        .update({
          brand: editFormData.brand,
          colour: editFormData.colour,
          material: editFormData.material,
          shape: editFormData.shape,
          rim: editFormData.rim,
          vision_type: editFormData.vision_type || null,
          lens_colour: editFormData.lens_colour || null,
          lens_thickness: editFormData.lens_thickness || null,
          gender: editFormData.gender || null,
          size: editFormData.size || null,
          lens_width: editFormData.lens_width || null,
          bridge_width: editFormData.bridge_width || null,
          temple_length: editFormData.temple_length || null,
          quantity: editFormData.quantity,
          supplier_code: editFormData.supplier_code || null,
          cost_price: editFormData.cost_price || null,
          selling_price: editFormData.selling_price || null,
        })
        .eq('id', editFrame.id);

      if (error) {
        console.error("Error updating frame:", error);
        throw error;
      }

      console.log("Frame updated successfully");
      
      toast({
        title: "Success",
        description: "Frame updated successfully.",
      });

      setIsEditDialogOpen(false);
      setEditFrame(null);
      setEditFormData({});
      fetchFrames();
    } catch (error) {
      console.error('Error updating frame:', error);
      toast({
        title: "Error",
        description: "Failed to update frame.",
        variant: "destructive",
      });
    }
  };

  const filteredFrames = frames.filter(
    (frame) =>
      frame.brand.toLowerCase().includes(filter.toLowerCase()) ||
      frame.colour.toLowerCase().includes(filter.toLowerCase()) ||
      frame.material.toLowerCase().includes(filter.toLowerCase()) ||
      frame.shape.toLowerCase().includes(filter.toLowerCase()) ||
      frame.code.toString().includes(filter)
  );

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Frame List</h1>
            <p className="text-gray-600">Loading frames...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Frame List</h1>
          <p className="text-gray-600">View and manage all frames in your inventory</p>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Filter by code, brand, colour, material, or shape..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-md"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Frames Inventory ({filteredFrames.length} items)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Colour</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Shape</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFrames.map((frame) => (
                  <TableRow key={frame.id}>
                    <TableCell className="font-medium">{frame.code}</TableCell>
                    <TableCell className="font-medium">{frame.brand}</TableCell>
                    <TableCell>{frame.colour}</TableCell>
                    <TableCell>{frame.material}</TableCell>
                    <TableCell>{frame.shape}</TableCell>
                    <TableCell>{frame.size || 'N/A'}</TableCell>
                    <TableCell>
                      {frame.selling_price ? `$${frame.selling_price.toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        frame.quantity > 10 ? 'bg-green-100 text-green-800' :
                        frame.quantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {frame.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="space-x-2">
                      {/* View Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedFrame(frame)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Frame Details - Code: {selectedFrame?.code}</DialogTitle>
                            <DialogDescription>
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                  <p><strong>Code:</strong> {selectedFrame?.code}</p>
                                  <p><strong>Brand:</strong> {selectedFrame?.brand}</p>
                                  <p><strong>Colour:</strong> {selectedFrame?.colour}</p>
                                  <p><strong>Material:</strong> {selectedFrame?.material}</p>
                                  <p><strong>Shape:</strong> {selectedFrame?.shape}</p>
                                  <p><strong>Rim:</strong> {selectedFrame?.rim}</p>
                                  <p><strong>Gender:</strong> {selectedFrame?.gender || 'N/A'}</p>
                                  <p><strong>Supplier Code:</strong> {selectedFrame?.supplier_code || 'N/A'}</p>
                                </div>
                                <div>
                                  <p><strong>Size:</strong> {selectedFrame?.size || 'N/A'}</p>
                                  <p><strong>Lens Width:</strong> {selectedFrame?.lens_width || 'N/A'}mm</p>
                                  <p><strong>Bridge Width:</strong> {selectedFrame?.bridge_width || 'N/A'}mm</p>
                                  <p><strong>Temple Length:</strong> {selectedFrame?.temple_length || 'N/A'}mm</p>
                                  <p><strong>Quantity:</strong> {selectedFrame?.quantity}</p>
                                  <p><strong>Cost Price:</strong> {selectedFrame?.cost_price ? `$${selectedFrame.cost_price.toFixed(2)}` : 'N/A'}</p>
                                  <p><strong>Selling Price:</strong> {selectedFrame?.selling_price ? `$${selectedFrame.selling_price.toFixed(2)}` : 'N/A'}</p>
                                  <p><strong>Vision Type:</strong> {selectedFrame?.vision_type || 'N/A'}</p>
                                </div>
                              </div>
                            </DialogDescription>
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>

                      {/* Edit Dialog */}
                      {hasPermission('update') && (
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleEdit(frame)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Frame - Code: {editFrame?.code}</DialogTitle>
                              <DialogDescription>
                                <div className="space-y-6 mt-4">
                                  {/* Frame Details */}
                                  <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(frameOptions).map(([key, values]) => (
                                      <div key={key}>
                                        <Label className="block mb-1 capitalize">{key}</Label>
                                        <Select 
                                          value={editFormData[key as keyof typeof editFormData] as string} 
                                          onValueChange={(value) => setEditFormData({...editFormData, [key]: value})}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder={`Select ${key}`} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {values.map((opt) => (
                                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    ))}
                                    <div>
                                      <Label className="block mb-1">Gender</Label>
                                      <Select 
                                        value={editFormData.gender as string} 
                                        onValueChange={(value) => setEditFormData({...editFormData, gender: value})}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select Gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {genderOptions.map((opt) => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  {/* Size Details */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="block mb-1">Lens Width (mm)</Label>
                                      <Input 
                                        type="number" 
                                        value={editFormData.lens_width || ''} 
                                        onChange={(e) => setEditFormData({...editFormData, lens_width: Number(e.target.value)})}
                                      />
                                    </div>
                                    <div>
                                      <Label className="block mb-1">Bridge Width (mm)</Label>
                                      <Input 
                                        type="number" 
                                        value={editFormData.bridge_width || ''} 
                                        onChange={(e) => setEditFormData({...editFormData, bridge_width: Number(e.target.value)})}
                                      />
                                    </div>
                                    <div>
                                      <Label className="block mb-1">Temple Length (mm)</Label>
                                      <Input 
                                        type="number" 
                                        value={editFormData.temple_length || ''} 
                                        onChange={(e) => setEditFormData({...editFormData, temple_length: Number(e.target.value)})}
                                      />
                                    </div>
                                    <div>
                                      <Label className="block mb-1">Quantity</Label>
                                      <Input 
                                        type="number" 
                                        min="0"
                                        value={editFormData.quantity || ''} 
                                        onChange={(e) => setEditFormData({...editFormData, quantity: Number(e.target.value)})}
                                      />
                                    </div>
                                  </div>

                                  {/* Pricing Details */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="block mb-1">Supplier Code</Label>
                                      <Input 
                                        type="text" 
                                        value={editFormData.supplier_code || ''} 
                                        onChange={(e) => setEditFormData({...editFormData, supplier_code: e.target.value})}
                                      />
                                    </div>
                                    <div>
                                      <Label className="block mb-1">Cost Price ($)</Label>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        min="0"
                                        value={editFormData.cost_price || ''} 
                                        onChange={(e) => setEditFormData({...editFormData, cost_price: Number(e.target.value)})}
                                      />
                                    </div>
                                    <div>
                                      <Label className="block mb-1">Selling Price ($)</Label>
                                      <Input 
                                        type="number" 
                                        step="0.01"
                                        min="0"
                                        value={editFormData.selling_price || ''} 
                                        onChange={(e) => setEditFormData({...editFormData, selling_price: Number(e.target.value)})}
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-end space-x-2">
                                    <Button 
                                      variant="outline" 
                                      onClick={() => setIsEditDialogOpen(false)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button onClick={handleSaveEdit}>
                                      Save Changes
                                    </Button>
                                  </div>
                                </div>
                              </DialogDescription>
                            </DialogHeader>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Delete Button */}
                      {hasPermission('delete') && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the frame
                                "Code {frame.code} - {frame.brand} {frame.colour}" from the inventory.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(frame.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredFrames.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No frames found. {filter ? 'Try adjusting your filter.' : 'Add some frames to get started.'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
