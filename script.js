/* 247 Victoria Cleaners — Invoice Generator
   - Live preview
   - Auto calculations (GST default 10%, discount before GST, deposit deducted after)
   - One-click PDF download (html2pdf)
   Notes:
   • If "Deposit" is chosen as the Base Service, the separate Deposit row is hidden
     so the invoice can be for deposit-only.
*/

const el = (id) => document.getElementById(id);
const fmt = (n) =>
  (isNaN(n) ? 0 : n).toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });

/* DOM refs */
const baseService = el("baseService");
const customServiceWrap = el("customServiceWrap");
const customService = el("customService");
const baseAmount = el("baseAmount");

const addonsText = el("addonsText");
const addonsAmount = el("addonsAmount");

const gstIncluded = el("gstIncluded");
const gstAmountInput = el("gstAmount");

const discountEnabled = el("discountEnabled");
const discountFields = el("discountFields");
const discountAmountInput = el("discountAmountInput");
const statusSel = el("status");
const depositAmount = el("depositAmount");
const depositShown = el("depositShown");

const totalOverride = el("totalOverride");

const downloadBtn = el("downloadBtn");

/* Preview cells */
const badge = el("badge");
const baseDesc = el("baseDesc");
const baseAmt = el("baseAmt");

const rowAddons = el("rowAddons");
const addonsDesc = el("addonsDesc");
const addonsAmt = el("addonsAmt");

const rowGST = el("rowGST");
const gstDesc = el("gstDesc");
const gstAmt = el("gstAmt");

const rowDiscount = el("rowDiscount");
const discountDesc = el("discountDesc");
const discountAmt = el("discountAmt");

const rowDeposit = el("rowDeposit");
const depositAmt = el("depositAmt");

const totalAmt = el("totalAmt");

const kvName = el("kvName");
const kvDate = el("kvDate");
const kvLoc = el("kvLoc");

const custName = el("custName");
const cleanDate = el("cleanDate");
const cleanLoc = el("cleanLoc");

/* Helpers */
function currentBaseTitle() {
  if (baseService.value === "Custom")
    return customService.value.trim() || "Custom Service";
  if (baseService.value === "Deposit (Invoice for Deposit Only)")
    return "Deposit";
  return baseService.value;
}

/* Manual mode: discount type not used */

/* Manual rendering: no automatic calculations */
function recalcAndRender() {
  // Titles / status
  const title = currentBaseTitle();
  baseDesc.textContent = title;

  // Base/Addons numbers (direct)
  const base = parseFloat(baseAmount.value || "0");
  const addons = parseFloat(addonsAmount.value || "0");

  // Optional addons row
  const addonsLabel = addonsText.value.trim();
  if ((addonsLabel && addons > 0) || addons > 0) {
    rowAddons.classList.remove("hide");
    addonsDesc.textContent = `Addons${addonsLabel ? ": " + addonsLabel : ""}`;
    addonsAmt.textContent = fmt(addons);
  } else {
    rowAddons.classList.add("hide");
  }

  // Discount (manual)
  if (discountEnabled.checked) {
    discountFields.classList.remove("hide");
    const dVal = Math.max(0, parseFloat(discountAmountInput.value || "0"));
    if (dVal > 0) {
      rowDiscount.classList.remove("hide");
      discountDesc.textContent = "Discount";
      discountAmt.textContent = `-${fmt(dVal).replace("$", "")}`;
    } else {
      rowDiscount.classList.add("hide");
    }
  } else {
    discountFields.classList.add("hide");
    rowDiscount.classList.add("hide");
  }

  // GST (manual show/hide + amount)
  if (gstIncluded.checked) {
    rowGST.classList.remove("hide");
    const gVal = Math.max(0, parseFloat(gstAmountInput.value || "0"));
    gstDesc.textContent = "GST";
    gstAmt.textContent = fmt(gVal);
  } else {
    rowGST.classList.add("hide");
  }

  // Deposit row (manual show/hide)
  if (depositShown.checked) {
    rowDeposit.classList.remove("hide");
    const dep = Math.max(0, parseFloat(depositAmount.value || "0"));
    depositAmt.textContent = `-${fmt(dep).replace("$", "")}`;
  } else {
    rowDeposit.classList.add("hide");
  }

  // Totals (manual override)
  const total = Math.max(0, parseFloat(totalOverride.value || "0"));
  baseAmt.textContent = fmt(base);
  totalAmt.textContent = fmt(total);

  // Status
  const paid = statusSel.value === "PAID";
  badge.textContent = paid ? "PAID" : "UNPAID";
  badge.style.background = paid ? "var(--ok)" : "var(--bad)";

  // Customer details
  kvName.textContent = custName.value.trim() || "—";
  kvDate.textContent = cleanDate.value.trim() || "—";
  kvLoc.textContent = cleanLoc.value.trim() || "—";
}

/* Events */
[
  baseService,
  customService,
  baseAmount,
  addonsText,
  addonsAmount,
  gstIncluded,
  gstAmountInput,
  discountEnabled,
  discountAmountInput,
  statusSel,
  depositAmount,
  depositShown,
  totalOverride,
  custName,
  cleanDate,
  cleanLoc,
].forEach((ctrl) => ctrl.addEventListener("input", onInput));

/* Manual mode: no discount type radios */

function onInput() {
  // Show custom field iff "Custom" selected
  if (baseService.value === "Custom") {
    customServiceWrap.classList.remove("hide");
  } else {
    customServiceWrap.classList.add("hide");
  }

  // Show discount fieldset iff enabled
  if (discountEnabled.checked) {
    discountFields.classList.remove("hide");
  } else {
    discountFields.classList.add("hide");
  }

  recalcAndRender();
}

/* PDF Download */
downloadBtn.addEventListener("click", () => {
  const invoice = document.getElementById("invoice");
  const name = (custName.value || "Invoice").replace(/[^\w\d-_ ]+/g, "").trim();
  const file = `Invoice_${name || "Customer"}.pdf`;

  recalcAndRender(); // Ensure latest values before rendering

  html2canvas(invoice, { scale: 2 }).then((canvas) => {
    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(file);
  });
});

/* Init */
window.addEventListener("DOMContentLoaded", () => {
  recalcAndRender();
});
