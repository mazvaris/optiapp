import { useForm } from "react-hook-form";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpenseFormData {
  date: string;
  vendor: string;
  category: string;
  otherCategory?: string;
  amount: number;
  paymentMethod: string;
  notes: string;
}

export default function AddExpenseForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExpenseFormData>();

  // Controlled values for Select components
  const category = watch("category");
  const paymentMethod = watch("paymentMethod");
  const [showOtherCategory, setShowOtherCategory] = useState(false);

  const onSubmit = (data: ExpenseFormData) => {
    // If category is "Other", save 'otherCategory' to category
    if (data.category === "Other" && data.otherCategory) {
      data.category = data.otherCategory;
      delete data.otherCategory;
    }
    console.log(data);
  };

  const categories = [
    "Rent",
    "Salaries",
    "Equipment",
    "Supplies",
    "Utilities",
    "Marketing",
    "Software",
    "Insurance",
    "Miscellaneous",
    "Other"
  ];

  const paymentMethods = ["Cash", "Bank Transfer", "Credit Card"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <Card className="w-full max-w-lg rounded-2xl shadow-lg border border-slate-200">
        <CardContent className="p-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-6 text-gray-900 tracking-tight">
            Add Expense
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Date & Vendor/Receiver */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date<span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  {...register("date", { required: true })}
                  className="rounded-lg border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition px-3 py-2"
                />
                {errors.date && (
                  <span className="text-rose-500 text-xs mt-1">Date is required</span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor/Receiver<span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  {...register("vendor", { required: true })}
                  placeholder="e.g., Optical Supplier"
                  className="rounded-lg border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder:text-gray-400 px-3 py-2"
                />
                {errors.vendor && (
                  <span className="text-rose-500 text-xs mt-1">Vendor/Receiver is required</span>
                )}
              </div>
            </div>

            {/* Category & Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category<span className="text-rose-500">*</span>
                </label>
                <Select
                  value={category || ""}
                  onValueChange={(value) => {
                    setValue("category", value, { shouldValidate: true });
                    setShowOtherCategory(value === "Other");
                  }}
                >
                  <SelectTrigger
                    className={`rounded-lg border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition px-3 py-2 bg-white ${errors.category ? "border-rose-500" : ""}`}
                  >
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white rounded-xl shadow-xl p-2 border border-slate-200 max-h-48 overflow-y-auto">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="rounded-lg px-3 py-2 hover:bg-blue-50 data-[state=checked]:bg-blue-100">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <span className="text-rose-500 text-xs mt-1">Category is required</span>
                )}
                {/* Hidden input for RHF validation */}
                <input
                  type="hidden"
                  {...register("category", { required: true })}
                  value={category || ""}
                />
                {showOtherCategory && (
                  <div className="mt-2">
                    <Input
                      {...register("otherCategory", { required: showOtherCategory })}
                      placeholder="Please specify other category"
                      className="rounded-lg border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder:text-gray-400 px-3 py-2 mt-2"
                    />
                    {errors.otherCategory && (
                      <span className="text-rose-500 text-xs mt-1">Please specify the category</span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount<span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("amount", { required: true, min: 0 })}
                  placeholder="e.g., 250.00"
                  className="rounded-lg border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder:text-gray-400 px-3 py-2"
                />
                {errors.amount && (
                  <span className="text-rose-500 text-xs mt-1">
                    Amount must be non-negative
                  </span>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method<span className="text-rose-500">*</span>
              </label>
              <Select
                value={paymentMethod || ""}
                onValueChange={(value) => setValue("paymentMethod", value, { shouldValidate: true })}
              >
                <SelectTrigger
                  className={`rounded-lg border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition px-3 py-2 bg-white ${errors.paymentMethod ? "border-rose-500" : ""}`}
                >
                  <SelectValue placeholder="Select Payment Method" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl shadow-xl p-2 border border-slate-200">
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method} className="rounded-lg px-3 py-2 hover:bg-blue-50 data-[state=checked]:bg-blue-100">
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentMethod && (
                <span className="text-rose-500 text-xs mt-1">Payment Method is required</span>
              )}
              {/* Hidden input for RHF validation */}
              <input
                type="hidden"
                {...register("paymentMethod", { required: true })}
                value={paymentMethod || ""}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <Textarea
                {...register("notes")}
                placeholder="e.g., New lens polishing tool"
                className="rounded-lg border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition placeholder:text-gray-400 min-h-[48px] px-3 py-2"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-3 rounded-lg transition-all shadow focus:ring-2 focus:ring-blue-200"
            >
              Submit Expense
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

