const mongoose = require('mongoose');

const stockTransferSchema = mongoose.Schema(
  {
    fromStore: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    toStore: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        imei: [{ type: String }]
      }
    ],
    status: { type: String, enum: ['pending', 'in_transit', 'completed', 'cancelled'], default: 'pending' },
    dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dispatchedAt: { type: Date },
    receivedAt: { type: Date },
    notes: { type: String },
    trackingNumber: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockTransfer', stockTransferSchema);
