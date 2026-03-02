import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAccountMembership extends Document {
  userId: Types.ObjectId;
  accountId: string;
  role: "owner";
  createdAt: Date;
}

const accountMembershipSchema = new Schema<IAccountMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    accountId: { type: String, required: true, index: true },
    role: { type: String, enum: ["owner"], default: "owner" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

accountMembershipSchema.index({ userId: 1, accountId: 1 }, { unique: true });

export const AccountMembership: Model<IAccountMembership> =
  mongoose.model<IAccountMembership>(
    "AccountMembership",
    accountMembershipSchema,
  );
