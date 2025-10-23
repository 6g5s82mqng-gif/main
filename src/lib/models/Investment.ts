import mongoose, { Document, Schema } from "mongoose";

export interface IInvestment extends Document {
  userId: number;
  amount: number;
  duration: number; // in days: 1, 7, 15, 30, 60, 90
  rewardPercentage: number; // based on duration
  status: "active" | "completed" | "cancelled";
  autoResubmit: boolean;
  startDate: Date;
  endDate: Date;
  profit: number;
  estimatedIncome: number;
  createdAt: Date;
  updatedAt: Date;
}

const investmentSchema = new Schema<IInvestment>(
  {
    userId: {
      type: Number,
      required: true,
      ref: "User",
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    duration: {
      type: Number,
      required: true,
      enum: [1, 7, 15, 30, 60, 90],
    },
    rewardPercentage: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    autoResubmit: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      required: false,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: false,
    },
    profit: {
      type: Number,
      default: 0,
    },
    estimatedIncome: {
      type: Number,
      default: 0,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

// Calculate end date and estimated income before saving
investmentSchema.pre("save", function (next) {
  if (this.isNew) {
    // Calculate end date
    this.set(
      "endDate",
      new Date(
        this.get("startDate").getTime() +
          this.get("duration") * 24 * 60 * 60 * 1000,
      ),
    );

    // Calculate estimated income
    this.set(
      "estimatedIncome",
      (this.get("amount") * this.get("rewardPercentage")) / 100,
    );
  }
  next();
});

// Index for efficient queries
investmentSchema.index({ userId: 1, status: 1 });
investmentSchema.index({ userId: 1, createdAt: -1 });

// Create model directly without checking mongoose.models
let Investment: any;
try {
  Investment = mongoose.model("BNPInvestment");
} catch {
  Investment = mongoose.model<IInvestment>("BNPInvestment", investmentSchema);
}

export default Investment;
