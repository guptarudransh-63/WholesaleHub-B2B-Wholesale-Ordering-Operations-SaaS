import PDFDocument from 'pdfkit';
import { Invoice } from '../models/Invoice.js';
import { Order } from '../models/Order.js';
import { RetailerProfile } from '../models/RetailerProfile.js';

export async function createInvoiceForOrder(orderId) {
  const order = await Order.findById(orderId).populate('retailer');
  if (!order) {
    throw new Error('Order not found');
  }

  // Check if invoice already exists
  let existingInvoice = await Invoice.findOne({ order: orderId });
  if (existingInvoice) {
    return existingInvoice;
  }

  const invoiceCount = await Invoice.countDocuments();
  const year = new Date().getFullYear();
  const invoiceNumber = `INV-${year}-${String(invoiceCount + 1001).padStart(5, '0')}`;

  // Determine due date
  const now = new Date();
  const dueDate = new Date(now);
  const terms = order.paymentTerms || 'net_15';

  if (terms === 'net_7') dueDate.setDate(now.getDate() + 7);
  else if (terms === 'net_15') dueDate.setDate(now.getDate() + 15);
  else if (terms === 'net_30') dueDate.setDate(now.getDate() + 30);
  else if (terms === 'advance' || terms === 'cod') dueDate.setDate(now.getDate());
  else if (terms === 'custom' && order.retailer?.customPaymentTermsDays) {
    dueDate.setDate(now.getDate() + order.retailer.customPaymentTermsDays);
  } else {
    dueDate.setDate(now.getDate() + 15);
  }

  // Calculate taxes and items
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let totalTax = 0;

  const invoiceItems = order.items.map((item) => {
    const halfTax = Number((item.taxAmount / 2).toFixed(2));
    cgstTotal += halfTax;
    sgstTotal += halfTax;
    totalTax += item.taxAmount;

    return {
      product: item.product,
      name: item.name,
      sku: item.sku,
      hsnCode: item.hsnCode || '999999',
      unitOfMeasurement: item.unitOfMeasurement || 'case',
      quantity: item.quantity,
      unitPrice: item.appliedUnitPrice,
      discount: item.discountPerUnit * item.quantity,
      taxRate: item.taxRate,
      taxableAmount: item.subtotal,
      cgstAmount: halfTax,
      sgstAmount: halfTax,
      igstAmount: 0,
      totalTax: item.taxAmount,
      totalAmount: item.total,
    };
  });

  const invoice = await Invoice.create({
    invoiceNumber,
    order: order._id,
    retailer: order.retailer._id,
    invoiceDate: now,
    dueDate,
    items: invoiceItems,
    subtotal: order.subtotal,
    discountTotal: order.totalDiscount,
    taxBreakdown: {
      taxableAmount: order.subtotal,
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      igstTotal: 0,
      totalTax: Number(totalTax.toFixed(2)),
    },
    grandTotal: order.grandTotal,
    paidAmount: order.paymentStatus === 'paid' ? order.grandTotal : 0,
    outstandingAmount: order.paymentStatus === 'paid' ? 0 : order.grandTotal,
    status: order.paymentStatus === 'paid' ? 'paid' : 'unpaid',
    paymentTerms: order.paymentTerms,
    notes: `Tax invoice for Order ${order.orderNumber}. Subject to Gurugram jurisdiction.`,
  });

  // Link invoice back to order
  order.invoiceGenerated = true;
  order.invoiceId = invoice._id;
  await order.save();

  return invoice;
}

/**
 * Builds and streams a PDF Tax Invoice.
 */
export async function generateInvoicePDF(invoiceId, res) {
  const invoice = await Invoice.findById(invoiceId)
    .populate('order')
    .populate('retailer');

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${invoice.invoiceNumber}.pdf"`
  );

  doc.pipe(res);

  // Header
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .fillColor('#0f766e')
    .text('WholesaleHub', 40, 40)
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#64748b')
    .text('B2B Wholesale Ordering & Operations SaaS', 40, 68)
    .text(process.env.SUPPLIER_NAME || 'WholesaleHub Global Distribution Pvt. Ltd.', 40, 82)
    .text(`GSTIN: ${process.env.SUPPLIER_GSTIN || '27AABCU9603R1ZM'}`, 40, 96)
    .text(process.env.SUPPLIER_ADDRESS || 'Plot 42, Sector 18, Udyog Vihar Phase 4, Gurugram, Haryana', 40, 110)
    .text(`Email: ${process.env.SUPPLIER_EMAIL || 'procurement@wholesalehub.io'} | Phone: ${process.env.SUPPLIER_PHONE || '+91 124 4987 200'}`, 40, 124);

  // Invoice Meta Box
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text('TAX INVOICE', 400, 40, { align: 'right' })
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#334155')
    .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 65, { align: 'right' })
    .text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 400, 80, { align: 'right' })
    .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, 400, 95, { align: 'right' })
    .text(`Order No: ${invoice.order?.orderNumber || 'N/A'}`, 400, 110, { align: 'right' })
    .text(`Status: ${invoice.status.toUpperCase()}`, 400, 125, { align: 'right' });

  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, 145).lineTo(555, 145).stroke();

  // Billed To / Shipped To
  const retailer = invoice.retailer;
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text('BILLED TO (RETAILER):', 40, 160)
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#334155')
    .text(retailer?.businessName || 'Retailer Account', 40, 178)
    .text(`Contact: ${retailer?.contactPerson || 'Purchasing Department'}`, 40, 192)
    .text(`GSTIN: ${retailer?.gstin || 'Unregistered / Under Threshold'}`, 40, 206)
    .text(
      `${retailer?.billingAddress?.street || ''}, ${retailer?.billingAddress?.city || ''}, ${retailer?.billingAddress?.state || ''} - ${retailer?.billingAddress?.postalCode || ''}`,
      40,
      220,
      { width: 250 }
    );

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text('PAYMENT TERMS & STATUS:', 330, 160)
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#334155')
    .text(`Payment Terms: ${(invoice.paymentTerms || 'net_15').toUpperCase().replace('_', ' ')}`, 330, 178)
    .text(`Paid Amount: INR ${invoice.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 330, 192)
    .text(`Outstanding: INR ${invoice.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 330, 206);

  // Line Items Table Header
  const tableTop = 270;
  doc.rect(40, tableTop, 515, 24).fill('#f1f5f9');
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text('#', 45, tableTop + 7)
    .text('ITEM & SKU', 65, tableTop + 7)
    .text('QTY', 260, tableTop + 7, { align: 'right', width: 40 })
    .text('RATE (INR)', 310, tableTop + 7, { align: 'right', width: 60 })
    .text('TAX', 380, tableTop + 7, { align: 'right', width: 45 })
    .text('TOTAL (INR)', 435, tableTop + 7, { align: 'right', width: 115 });

  let yPos = tableTop + 28;
  invoice.items.forEach((item, index) => {
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#1e293b')
      .text(String(index + 1), 45, yPos)
      .text(`${item.name} (${item.sku})`, 65, yPos, { width: 190 })
      .text(`${item.quantity} ${item.unitOfMeasurement}`, 260, yPos, { align: 'right', width: 40 })
      .text(item.unitPrice.toFixed(2), 310, yPos, { align: 'right', width: 60 })
      .text(`${item.taxRate}%`, 380, yPos, { align: 'right', width: 45 })
      .text(item.totalAmount.toFixed(2), 435, yPos, { align: 'right', width: 115 });

    yPos += 22;
  });

  doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(40, yPos).lineTo(555, yPos).stroke();
  yPos += 15;

  // Totals Section
  const totalsLeft = 330;
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#475569')
    .text('Subtotal (Taxable Value):', totalsLeft, yPos)
    .text(`INR ${invoice.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, yPos, { align: 'right', width: 110 });

  yPos += 16;
  doc
    .text('CGST (Central Tax):', totalsLeft, yPos)
    .text(`INR ${invoice.taxBreakdown?.cgstTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`, 440, yPos, { align: 'right', width: 110 });

  yPos += 16;
  doc
    .text('SGST (State Tax):', totalsLeft, yPos)
    .text(`INR ${invoice.taxBreakdown?.sgstTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`, 440, yPos, { align: 'right', width: 110 });

  yPos += 18;
  doc.rect(totalsLeft - 10, yPos - 5, 235, 26).fill('#f8fafc');
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#0f766e')
    .text('GRAND TOTAL:', totalsLeft, yPos + 3)
    .text(`INR ${invoice.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 440, yPos + 3, { align: 'right', width: 110 });

  // Bank & Remittance Instructions
  yPos += 45;
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text('BANK TRANSFER & PAYMENT INSTRUCTIONS', 40, yPos)
    .font('Helvetica')
    .fillColor('#475569')
    .text('Bank: HDFC Bank Ltd. | Account: WholesaleHub Operations Pvt Ltd', 40, yPos + 14)
    .text('A/C No: 50200084920194 | IFSC: HDFC0000492 | Branch: Gurugram Phase 4', 40, yPos + 26)
    .text('UPI ID: wholesalehub@hdfcbank | Remit with Invoice Number as reference.', 40, yPos + 38);

  // Footer Note
  doc
    .fontSize(8)
    .fillColor('#94a3b8')
    .text('This is a computer-generated tax invoice and requires no physical signature under IT Act 2000.', 40, 780, { align: 'center', width: 515 });

  doc.end();
}
