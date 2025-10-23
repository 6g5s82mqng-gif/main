import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  userId: number;
  username: string;
  password: string;
  withdrawPassword?: string;

  available_balance: number;
  profit_loss: number;
  cardphoto?: string;
  bank: {
    bank_name: string;
    number: string;
    fullname: string;
    withdrawNumber?: string;
  } | null;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    userId: {
      type: Number,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    available_balance: {
      type: Number,
      default: 0,
    },
    profit_loss: {
      type: Number,
      default: 0,
    },
    cardphoto: {
      type: String,
      default: null,
    },
    bank: {
      type: {
        bank_name: String,
        number: String,
        fullname: String,
        withdrawNumber: String,
      },
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
