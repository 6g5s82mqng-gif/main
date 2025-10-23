import mongoose, { Document, Schema } from "mongoose";

export interface IInvestmentPlan extends Document {
  duration: number; // in days: 1, 7, 15, 30, 60, 90
  label: string; // e.g., "1D", "7D", "15D", "30D", "60D", "90D"
  rewardPercentage: number; // based on duration
  minAmount: number; // minimum investment amount
  maxAmount: number; // maximum investment amount
  createdAt: Date;
  updatedAt: Date;
}

const investmentPlanSchema = new Schema<IInvestmentPlan>(
  {
    duration: {
      type: Number,
      required: true,
      unique: true,
      enum: [1, 7, 15, 30, 60, 90],
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    rewardPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    minAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    maxAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 1000000,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
investmentPlanSchema.index({ duration: 1 });

// Create model directly without checking mongoose.models
let InvestmentPlan: any;
try {
  InvestmentPlan = mongoose.model("BNPInvestmentPlan");
} catch {
  InvestmentPlan = mongoose.model<IInvestmentPlan>(
    "BNPInvestmentPlan",
    investmentPlanSchema,
  );
}

export default InvestmentPlan;
