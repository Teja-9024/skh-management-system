// "use client"

// import type React from "react"
// import { useState, useEffect } from "react"
// import { useApi, useApiMutation } from "@/hooks/use-api"
// import { exportToPDF } from "@/utils/exportToPDF"
// import { exportToExcel } from "@/utils/exportToExcel"

// interface TransactionData {
//   transactionType: "borrowed" | "lent" | "repayment"
//   date: string
//   amount: number
//   paymentMethod: string
//   destination: string
//   personName?: string // keep for backward-compat if API returns it
//   contactInfo: string
//   primaryPurpose: string
//   expectedReturnDate: string
//   interestRate: number
//   interestType: string
//   status: string
//   detailedDescription: string
//   lenderName: string
//   borrowerName: string
// }

// export default function BorrowedMoney() {
//   const [formData, setFormData] = useState<TransactionData>({
//     transactionType: "lent",
//     date: new Date().toISOString().split("T")[0],
//     amount: 0,
//     paymentMethod: "Cash",
//     destination: "Individual Person",
//     personName: "",
//     contactInfo: "",
//     primaryPurpose: "Market Purchase",
//     expectedReturnDate: "",
//     interestRate: 0,
//     interestType: "No Interest",
//     status: "Active/Outstanding",
//     detailedDescription: "",
//     lenderName: "",
//     borrowerName: "",
//   })

//   const [transactions, setTransactions] = useState<
//     (TransactionData & { id: string })[]
//   >([])
//   const [activeFilter, setActiveFilter] = useState<
//     "all" | "borrowed" | "lent" | "repayment"
//   >("all")
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   const { loading: transactionsLoading, execute: fetchTransactions } = useApi()
//   const { mutate: createTransaction } = useApiMutation()
//   const { mutate: deleteTransactionMutation } = useApiMutation()

//   const paymentMethods = ["Cash", "Card", "UPI", "Bank Transfer", "Cheque"]
//   const destinations = ["Individual Person", "Business", "Bank", "Financial Institution"]
//   const purposes = ["Market Purchase", "Personal Use", "Business Expense", "Emergency", "Investment", "Other"]
//   const interestTypes = ["No Interest", "Simple Interest", "Compound Interest", "Fixed Rate"]
//   const statuses = ["Active/Outstanding", "Completed", "Overdue", "Partial Payment"]

//   useEffect(() => {
//     loadTransactions()
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   const loadTransactions = async () => {
//     try {
//       const data = await fetchTransactions("/api/money-transactions?limit=50")
//       setTransactions(data.transactions || [])
//     } catch (error) {
//       console.error("Failed to load transactions:", error)
//     }
//   }

//   // Filter transactions by active filter
//   const filteredTransactions = transactions.filter((t) =>
//     activeFilter === "all" ? true : t.transactionType === activeFilter
//   )

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     if (formData.transactionType === "borrowed" && !formData.lenderName.trim()) {
//       alert("Please enter lender's name")
//       return
//     }
//     if (formData.transactionType === "lent" && !formData.borrowerName.trim()) {
//       alert("Please enter borrower's name")
//       return
//     }
//     if (formData.amount <= 0) {
//       alert("Please enter a valid amount")
//       return
//     }

//     setIsSubmitting(true)
//     try {
//       const payload = {
//         transactionType: formData.transactionType.toUpperCase(), // API expects ENUM-like
//         date: formData.date,
//         amount: Number(formData.amount),
//         paymentMethod: formData.paymentMethod.toUpperCase().replace(' ', '_'),
//         destination: formData.destination,
//         personName:
//           formData.transactionType === "borrowed"
//             ? formData.lenderName
//             : formData.borrowerName,
//         contactInfo: formData.contactInfo,
//         primaryPurpose: formData.primaryPurpose,
//         expectedReturnDate: formData.expectedReturnDate || null,
//         interestRate: Number(formData.interestRate || 0),
//         interestType: formData.interestType.toUpperCase().replace(" ", "_"),
//         status: formData.status.toUpperCase().replace("/", "_"),
//         detailedDescription: formData.detailedDescription,
//         lenderName: formData.lenderName,
//         borrowerName: formData.borrowerName,
//       }

//       await createTransaction("/api/money-transactions", { body: payload })

//       // Reset form
//       setFormData({
//         transactionType: "lent",
//         date: new Date().toISOString().split("T")[0],
//         amount: 0,
//         paymentMethod: "Cash",
//         destination: "Individual Person",
//         personName: "",
//         contactInfo: "",
//         primaryPurpose: "Market Purchase",
//         expectedReturnDate: "",
//         interestRate: 0,
//         interestType: "No Interest",
//         status: "Active/Outstanding",
//         detailedDescription: "",
//         lenderName: "",
//         borrowerName: "",
//       })

//       await loadTransactions()
//       alert("Transaction saved successfully!")
//     } catch (error: any) {
//       alert(`Failed to save transaction: ${error.message}`)
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const editTransaction = (transaction: TransactionData & { id: string }) => {
//     setFormData({
//       transactionType: transaction.transactionType,
//       date: transaction.date,
//       amount: transaction.amount,
//       paymentMethod: transaction.paymentMethod,
//       destination: transaction.destination,
//       personName: transaction.personName || "",
//       contactInfo: transaction.contactInfo,
//       primaryPurpose: transaction.primaryPurpose,
//       expectedReturnDate: transaction.expectedReturnDate,
//       interestRate: transaction.interestRate,
//       interestType: transaction.interestType,
//       status: transaction.status,
//       detailedDescription: transaction.detailedDescription,
//       lenderName: transaction.lenderName,
//       borrowerName: transaction.borrowerName,
//     })
//     window.scrollTo({ top: 0, behavior: "smooth" })
//   }

//   const deleteTransaction = async (transactionId: string) => {
//     if (!confirm("Are you sure you want to delete this transaction?")) return
//     try {
//       await deleteTransactionMutation(`/api/money-transactions/${transactionId}`, { method: 'DELETE' })
//       await loadTransactions()
//       alert("Transaction deleted successfully!")
//     } catch (error) {
//       alert("Failed to delete transaction")
//     }
//   }

//   const totals = transactions.reduce(
//     (acc, t) => {
//       if (t.transactionType === "borrowed") acc.borrowed += t.amount
//       else if (t.transactionType === "lent") acc.lent += t.amount
//       return acc
//     },
//     { borrowed: 0, lent: 0 }
//   )

//   const netOutstanding = totals.borrowed - totals.lent

//   return (
//     <div className="space-y-6">
//       <div className="mb-6">
//         <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Money Management Tracker</h2>
//         <p className="text-gray-600">
//           Track borrowed money, lending, and money usage with detailed records
//         </p>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
//         <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-xs sm:text-sm font-medium text-gray-600">Total Money Borrowed</p>
//               <p className="text-lg sm:text-2xl font-bold text-red-600">
//                 ₹{totals.borrowed.toLocaleString("en-IN")}
//               </p>
//             </div>
//             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
//               <span className="text-red-600 text-lg sm:text-xl">📉</span>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-xs sm:text-sm font-medium text-gray-600">Total Money Lent</p>
//               <p className="text-lg sm:text-2xl font-bold text-blue-600">
//                 ₹{totals.lent.toLocaleString("en-IN")}
//               </p>
//             </div>
//             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
//               <span className="text-blue-600 text-lg sm:text-xl">📈</span>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-xs sm:text-sm font-medium text-gray-600">Net Outstanding</p>
//               <p
//                 className={`text-lg sm:text-2xl font-bold ${
//                   netOutstanding >= 0 ? "text-orange-600" : "text-green-600"
//                 }`}
//               >
//                 ₹{Math.abs(netOutstanding).toLocaleString("en-IN")}
//               </p>
//             </div>
//             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
//               <span className="text-orange-600 text-lg sm:text-xl">💰</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Transaction Type + Form */}
//       <div className="bg-white rounded-lg card-shadow p-4 sm:p-6 mb-6">
//         <h3 className="text-lg font-semibold mb-6">Transaction Type</h3>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
//           {[
//             { key: "borrowed", title: "Money Borrowed", sub: "We received money from someone" },
//             { key: "lent", title: "Money Lent", sub: "We gave money to someone" },
//             { key: "repayment", title: "Repayment", sub: "Returning borrowed money" },
//           ].map((opt) => (
//             <div className="border rounded-lg p-4" key={opt.key}>
//               <label className="flex items-start space-x-3 cursor-pointer">
//                 <input
//                   type="radio"
//                   name="transactionType"
//                   value={opt.key}
//                   checked={formData.transactionType === (opt.key as any)}
//                   onChange={(e) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       transactionType: e.target.value as TransactionData["transactionType"],
//                     }))
//                   }
//                   className="mt-1"
//                 />
//                 <div>
//                   <div className="font-medium text-gray-900">{opt.title}</div>
//                   <div className="text-sm text-gray-500">{opt.sub}</div>
//                 </div>
//               </label>
//             </div>
//           ))}
//         </div>

//         <form className="space-y-6" onSubmit={handleSubmit}>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
//               <input
//                 type="date"
//                 required
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
//                 value={formData.date}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
//               <input
//                 type="number"
//                 required
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
//                 value={formData.amount || ""}
//                 onChange={(e) =>
//                   setFormData((prev) => ({ ...prev, amount: Number.parseFloat(e.target.value) || 0 }))
//                 }
//                 placeholder="0"
//                 step="0.01"
//                 min="0.01"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
//               <select
//                 required
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
//                 value={formData.paymentMethod}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
//               >
//                 {paymentMethods.map((method) => (
//                   <option key={method} value={method}>
//                     {method}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 {formData.transactionType === "borrowed"
//                   ? "Lender's Name"
//                   : formData.transactionType === "lent"
//                   ? "Borrower's Name"
//                   : "Lender's Name"}
//               </label>
//               <input
//                 type="text"
//                 required
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
//                 value={formData.lenderName}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, lenderName: e.target.value }))}
//                 placeholder={
//                   formData.transactionType === "borrowed"
//                     ? "Name of person who lent us money"
//                     : formData.transactionType === "lent"
//                     ? "Name of person who borrowed from us"
//                     : "Name of person we're repaying"
//                 }
//               />
//               <p className="text-xs text-gray-500 mt-1">
//                 {formData.transactionType === "borrowed"
//                   ? "The person who lent us money"
//                   : formData.transactionType === "lent"
//                   ? "The person who borrowed from us"
//                   : "The person we're repaying"}
//               </p>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 {formData.transactionType === "borrowed"
//                   ? "Borrower's Name"
//                   : formData.transactionType === "lent"
//                   ? "Lender's Name"
//                   : "Borrower's Name"}
//               </label>
//               <input
//                 type="text"
//                 required
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
//                 value={formData.borrowerName}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, borrowerName: e.target.value }))}
//                 placeholder={
//                   formData.transactionType === "borrowed"
//                     ? "Our name (we borrowed)"
//                     : formData.transactionType === "lent"
//                     ? "Our name (we lent)"
//                     : "Name of person receiving repayment"
//                 }
//               />
//               <p className="text-xs text-gray-500 mt-1">
//                 {formData.transactionType === "borrowed"
//                   ? "Our name (we are the borrower)"
//                   : formData.transactionType === "lent"
//                   ? "Our name (we are the lender)"
//                   : "The person receiving the repayment"}
//               </p>
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
//               <input
//                 type="text"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
//                 value={formData.contactInfo}
//                 onChange={(e) => setFormData((prev) => ({ ...prev, contactInfo: e.target.value }))}
//                 placeholder="Phone number or address"
//               />
//             </div>
//           </div>

//           <div className="border-t pt-6">
//             <h4 className="text-lg font-semibold mb-4">Purpose & Usage</h4>
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Primary Purpose</label>
//                 <select
//                   required
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
//                   value={formData.primaryPurpose}
//                   onChange={(e) => setFormData((prev) => ({ ...prev, primaryPurpose: e.target.value }))}
//                 >
//                   {purposes.map((purpose) => (
//                     <option key={purpose} value={purpose}>
//                       {purpose}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Expected Return Date</label>
//                 <input
//                   type="date"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
//                   value={formData.expectedReturnDate}
//                   onChange={(e) => setFormData((prev) => ({ ...prev, expectedReturnDate: e.target.value }))}
//                   placeholder="dd-mm-yyyy"
//                 />
//               </div>
//             </div>

//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
//                 <input
//                   type="number"
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
//                   value={formData.interestRate || ""}
//                   onChange={(e) =>
//                     setFormData((prev) => ({ ...prev, interestRate: Number.parseFloat(e.target.value) || 0 }))
//                   }
//                   placeholder="0"
//                   step="0.1"
//                   min="0"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Interest Type</label>
//                 <select
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
//                   value={formData.interestType}
//                   onChange={(e) => setFormData((prev) => ({ ...prev, interestType: e.target.value }))}
//                 >
//                   {interestTypes.map((type) => (
//                     <option key={type} value={type}>
//                       {type}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
//                 <select
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
//                   value={formData.status}
//                   onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
//                 >
//                   {statuses.map((status) => (
//                     <option key={status} value={status}>
//                       {status}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             <div className="mt-6">
//               <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description</label>
//               <textarea
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
//                 rows={4}
//                 value={formData.detailedDescription}
//                 onChange={(e) =>
//                   setFormData((prev) => ({ ...prev, detailedDescription: e.target.value }))
//                 }
//                 placeholder="Describe what this money was used for, any special terms, or additional notes..."
//               />
//             </div>
//           </div>

//           <div className="flex justify-end">
//             <button
//               type="submit"
//               disabled={isSubmitting}
//               className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isSubmitting ? "Saving..." : "Save Transaction"}
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* Recent Transactions */}
//       <div className="bg-white rounded-lg card-shadow p-4 sm:p-6">
//         <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
//           <h3 className="text-lg font-semibold mb-2 sm:mb-0">Recent Transactions</h3>

//           {transactions.length > 0 && (
//             <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-0">
//               <button
//                 type="button"
//                 onClick={() => {
//                   const data = filteredTransactions.map((t) => ({
//                     date: new Date(t.date).toLocaleDateString("en-IN"),
//                     type: t.transactionType.charAt(0).toUpperCase() + t.transactionType.slice(1),
//                     lender: t.lenderName,
//                     borrower: t.borrowerName,
//                     amount: t.amount,
//                     purpose: t.primaryPurpose,
//                     status: t.status,
//                     paymentMethod: t.paymentMethod,
//                     contactInfo: t.contactInfo,
//                     expectedReturnDate: t.expectedReturnDate
//                       ? new Date(t.expectedReturnDate).toLocaleDateString("en-IN")
//                       : "N/A",
//                     interestRate: t.interestRate,
//                     interestType: t.interestType,
//                     description: t.detailedDescription,
//                   }))
//                   exportToPDF({
//                     title: "Money Transactions Report",
//                     dateRange: `Generated on ${new Date().toLocaleDateString("en-IN")}`,
//                     columns: [
//                       "date",
//                       "type",
//                       "lender",
//                       "borrower",
//                       "amount",
//                       "purpose",
//                       "status",
//                       "paymentMethod",
//                       "contactInfo",
//                       "expectedReturnDate",
//                       "interestRate",
//                       "interestType",
//                       "description",
//                     ],
//                     data,
//                     columnLabels: [
//                       "Date",
//                       "Type",
//                       "Lender",
//                       "Borrower",
//                       "Amount",
//                       "Purpose",
//                       "Status",
//                       "Payment Method",
//                       "Contact Info",
//                       "Expected Return",
//                       "Interest Rate",
//                       "Interest Type",
//                       "Description",
//                     ],
//                     currencyColumns: ["amount", "interestRate"],
//                     orientation: "landscape",
//                   })
//                 }}
//                 className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
//               >
//                 📄 Download PDF
//               </button>
//               <button
//                 type="button"
//                 onClick={() => {
//                   const data = filteredTransactions.map((t) => ({
//                     date: new Date(t.date).toLocaleDateString("en-IN"),
//                     type: t.transactionType.charAt(0).toUpperCase() + t.transactionType.slice(1),
//                     lender: t.lenderName,
//                     borrower: t.borrowerName,
//                     amount: t.amount,
//                     purpose: t.primaryPurpose,
//                     status: t.status,
//                     paymentMethod: t.paymentMethod,
//                     contactInfo: t.contactInfo,
//                     expectedReturnDate: t.expectedReturnDate
//                       ? new Date(t.expectedReturnDate).toLocaleDateString("en-IN")
//                       : "N/A",
//                     interestRate: t.interestRate,
//                     interestType: t.interestType,
//                     description: t.detailedDescription,
//                   }))
//                   exportToExcel({
//                     title: "Money Transactions Report",
//                     dateRange: `Generated on ${new Date().toLocaleDateString("en-IN")}`,
//                     columns: [
//                       "date",
//                       "type",
//                       "lender",
//                       "borrower",
//                       "amount",
//                       "purpose",
//                       "status",
//                       "paymentMethod",
//                       "contactInfo",
//                       "expectedReturnDate",
//                       "interestRate",
//                       "interestType",
//                       "description",
//                     ],
//                     data,
//                     columnLabels: [
//                       "Date",
//                       "Type",
//                       "Lender",
//                       "Borrower",
//                       "Amount",
//                       "Purpose",
//                       "Status",
//                       "Payment Method",
//                       "Contact Info",
//                       "Expected Return",
//                       "Interest Rate",
//                       "Interest Type",
//                       "Description",
//                     ],
//                     currencyColumns: ["amount", "interestRate"],
//                   })
//                 }}
//                 className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
//               >
//                 📊 Download Excel
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Filter Buttons */}
//         <div className="flex flex-wrap gap-2 mb-4">
//           <button
//             type="button"
//             onClick={() => setActiveFilter("all")}
//             className={`px-3 py-1 text-xs rounded transition-colors ${
//               activeFilter === "all"
//                 ? "bg-gray-800 text-white"
//                 : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//             }`}
//           >
//             All
//           </button>
//           <button
//             type="button"
//             onClick={() => setActiveFilter("borrowed")}
//             className={`px-3 py-1 text-xs rounded transition-colors ${
//               activeFilter === "borrowed"
//                 ? "bg-red-600 text-white"
//                 : "bg-red-100 text-red-800 hover:bg-red-200"
//             }`}
//           >
//             Borrowed
//           </button>
//           <button
//             type="button"
//             onClick={() => setActiveFilter("lent")}
//             className={`px-3 py-1 text-xs rounded transition-colors ${
//               activeFilter === "lent"
//                 ? "bg-blue-600 text-white"
//                 : "bg-blue-100 text-blue-800 hover:bg-blue-200"
//             }`}
//           >
//             Lent
//           </button>
//           <button
//             type="button"
//             onClick={() => setActiveFilter("repayment")}
//             className={`px-3 py-1 text-xs rounded transition-colors ${
//               activeFilter === "repayment"
//                 ? "bg-green-600 text-white"
//                 : "bg-green-100 text-green-800 hover:bg-green-200"
//             }`}
//           >
//             Repayments
//           </button>
//         </div>

//         {/* Mobile Card View */}
//         <div className="block lg:hidden space-y-4">
//           {transactionsLoading ? (
//             <div className="text-center py-8">
//               <div className="text-gray-500">Loading transactions...</div>
//             </div>
//           ) : filteredTransactions.length > 0 ? (
//             filteredTransactions.map((transaction, index) => (
//               <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
//                 <div className="flex justify-between items-start">
//                   <div className="text-lg font-bold text-blue-600">#{transaction.id}</div>
//                   <span
//                     className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                       transaction.transactionType === "borrowed"
//                         ? "bg-red-100 text-red-800"
//                         : transaction.transactionType === "lent"
//                         ? "bg-blue-100 text-blue-800"
//                         : "bg-green-100 text-green-800"
//                     }`}
//                   >
//                     {transaction.transactionType.charAt(0).toUpperCase() +
//                       transaction.transactionType.slice(1)}
//                   </span>
//                 </div>

//                 <div className="grid grid-cols-2 gap-2 text-sm">
//                   <div>
//                     <div className="font-medium text-gray-500">Date</div>
//                     <div className="font-semibold">
//                       {new Date(transaction.date).toLocaleDateString("en-IN")}
//                     </div>
//                   </div>
//                   <div>
//                     <div className="font-medium text-gray-500">Amount</div>
//                     <div className="text-lg font-bold text-gray-900">
//                       ₹{transaction.amount.toLocaleString("en-IN")}
//                     </div>
//                   </div>
//                 </div>

//                 <div>
//                   <div className="font-medium text-gray-500 mb-1">Lender</div>
//                   <div className="font-semibold text-gray-800">{transaction.lenderName}</div>
//                 </div>

//                 <div>
//                   <div className="font-medium text-gray-500 mb-1">Borrower</div>
//                   <div className="font-semibold text-gray-800">{transaction.borrowerName}</div>
//                 </div>

//                 <div>
//                   <div className="font-medium text-gray-500 mb-1">Purpose</div>
//                   <div className="font-semibold text-gray-800">{transaction.primaryPurpose}</div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-2 text-sm">
//                   <div>
//                     <div className="font-medium text-gray-500">Payment Method</div>
//                     <div className="font-semibold">💳 {transaction.paymentMethod}</div>
//                   </div>
//                   <div>
//                     <div className="font-medium text-gray-500">Status</div>
//                     <span
//                       className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
//                         transaction.status === "Active/Outstanding" || transaction.status === "Active"
//                           ? "bg-yellow-100 text-yellow-800"
//                           : transaction.status === "Completed"
//                           ? "bg-green-100 text-green-800"
//                           : "bg-red-100 text-red-800"
//                       }`}
//                     >
//                       {transaction.status === "Active/Outstanding" || transaction.status === "Active"
//                         ? "⏳ Active"
//                         : transaction.status === "Completed"
//                         ? "✅ Completed"
//                         : "❌ " + (transaction.status || "Active")}
//                     </span>
//                   </div>
//                 </div>

//                 {transaction.contactInfo && (
//                   <div>
//                     <div className="font-medium text-gray-500 mb-1">Contact</div>
//                     <div className="text-sm text-blue-600">📞 {transaction.contactInfo}</div>
//                   </div>
//                 )}

//                 {transaction.expectedReturnDate && (
//                   <div>
//                     <div className="font-medium text-gray-500 mb-1">Expected Return</div>
//                     <div className="text-sm text-gray-600">
//                       📅 {new Date(transaction.expectedReturnDate).toLocaleDateString("en-IN")}
//                     </div>
//                   </div>
//                 )}

//                 {transaction.interestRate > 0 && (
//                   <div>
//                     <div className="font-medium text-gray-500 mb-1">Interest</div>
//                     <div className="text-sm text-gray-600">
//                       💹 {transaction.interestRate}% {transaction.interestType}
//                     </div>
//                   </div>
//                 )}

//                 <div className="flex space-x-2 pt-2">
//                   <button
//                     type="button"
//                     onClick={() => editTransaction(transaction)}
//                     className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
//                   >
//                     ✏️ Edit
//                   </button>
//                   <button
//                     type="button"
//                     onClick={() => deleteTransaction(transaction.id)}
//                     className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
//                   >
//                     🗑️ Delete
//                   </button>
//                 </div>
//               </div>
//             ))
//           ) : (
//             <div className="text-center py-8 text-gray-500">
//               <div className="text-lg font-medium mb-2">No Transactions Found</div>
//               <div className="text-sm">No transactions found for the selected filter.</div>
//             </div>
//           )}
//         </div>

//         {/* Desktop Table View */}
//         <div className="hidden lg:block overflow-x-auto">
//           {transactionsLoading ? (
//             <div className="text-center py-8">
//               <div className="text-gray-500">Loading transactions...</div>
//             </div>
//           ) : (
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date
//                   </th>
//                   <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Type
//                   </th>
//                   <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Lender
//                   </th>
//                   <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Borrower
//                   </th>
//                   <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Amount
//                   </th>
//                   <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Purpose
//                   </th>
//                   <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredTransactions.length > 0 ? (
//                   filteredTransactions.slice(0, 10).map((transaction) => (
//                     <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
//                       <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {new Date(transaction.date).toLocaleDateString("en-IN")}
//                       </td>
//                       <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
//                         <span
//                           className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                             transaction.transactionType === "borrowed"
//                               ? "bg-red-100 text-red-800"
//                               : transaction.transactionType === "lent"
//                               ? "bg-blue-100 text-blue-800"
//                               : "bg-green-100 text-green-800"
//                           }`}
//                         >
//                           {transaction.transactionType.charAt(0).toUpperCase() +
//                             transaction.transactionType.slice(1)}
//                         </span>
//                       </td>
//                       <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         <div>{transaction.lenderName}</div>
//                       </td>
//                       <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         <div>{transaction.borrowerName}</div>
//                       </td>
//                       <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
//                         ₹{transaction.amount.toLocaleString("en-IN")}
//                       </td>
//                       <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {transaction.primaryPurpose}
//                       </td>
//                       <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
//                         {transaction.status}
//                       </td>
//                       <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm space-x-2">
//                         <button
//                           type="button"
//                           onClick={() => editTransaction(transaction)}
//                           className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
//                         >
//                           Edit
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => deleteTransaction(transaction.id)}
//                           className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
//                         >
//                           Delete
//                         </button>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan={8} className="px-3 sm:px-6 py-4 text-center text-sm text-gray-500">
//                       No transactions found for the selected filter.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { z } from "zod"
import { useApi, useApiMutation } from "@/hooks/use-api"
import { exportToPDF } from "@/utils/exportToPDF"
import { exportToExcel } from "@/utils/exportToExcel"
import { toast } from "sonner"

// Zod validation schemas
const TransactionTypeEnum = z.enum(["borrowed", "lent", "repayment"])
const PaymentMethodEnum = z.enum(["Cash", "Card", "UPI", "Bank Transfer", "Cheque"])
const DestinationEnum = z.enum(["Individual Person", "Business", "Bank", "Financial Institution"])
const PurposeEnum = z.enum(["Market Purchase", "Personal Use", "Business Expense", "Emergency", "Investment", "Other"])
const InterestTypeEnum = z.enum(["No Interest", "Simple Interest", "Compound Interest", "Fixed Rate"])
const StatusEnum = z.enum(["ACTIVE", "COMPLETED", "OVERDUE", "PARTIAL_PAYMENT"])

const TransactionDataSchema = z.object({
  transactionType: TransactionTypeEnum,
  date: z.string().min(1, "Date is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  paymentMethod: PaymentMethodEnum,
  destination: DestinationEnum,
  contactInfo: z.string().optional(),
  primaryPurpose: PurposeEnum,
  expectedReturnDate: z.string().optional(),
  interestRate: z.number().min(0, "Interest rate cannot be negative").max(100, "Interest rate cannot exceed 100%"),
  interestType: InterestTypeEnum,
  status: StatusEnum,
  detailedDescription: z.string().optional(),
  lenderName: z.string().min(1, "Lender name is required"),
  borrowerName: z.string().min(1, "Borrower name is required"),
})

const TransactionWithIdSchema = TransactionDataSchema.extend({
  id: z.string(),
  personName: z.string().optional(), // for backward compatibility
})

type TransactionData = z.infer<typeof TransactionDataSchema>
type TransactionWithId = z.infer<typeof TransactionWithIdSchema>

interface FormErrors {
  [key: string]: string
}

interface ApiError {
  message: string
  status?: number
}

const FORM_CONSTANTS = {
  paymentMethods: ["Cash", "Card", "UPI", "Bank Transfer", "Cheque"] as const,
  destinations: ["Individual Person", "Business", "Bank", "Financial Institution"] as const,
  purposes: ["Market Purchase", "Personal Use", "Business Expense", "Emergency", "Investment", "Other"] as const,
  interestTypes: ["No Interest", "Simple Interest", "Compound Interest", "Fixed Rate"] as const,
  statuses: ["Active/Outstanding", "Completed", "Overdue", "Partial Payment"] as const,
}

const getInitialFormData = (): TransactionData => ({
  transactionType: "lent",
  date: new Date().toISOString().split("T")[0],
  amount: 0,
  paymentMethod: "Cash",
  destination: "Individual Person",
  contactInfo: "",
  primaryPurpose: "Market Purchase",
  expectedReturnDate: "",
  interestRate: 0,
  interestType: "No Interest",
  status: "ACTIVE",
  detailedDescription: "",
  lenderName: "",
  borrowerName: "",
})

export default function BorrowedMoney() {
  const [formData, setFormData] = useState<TransactionData>(getInitialFormData())
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [transactions, setTransactions] = useState<TransactionWithId[]>([])
  const [activeFilter, setActiveFilter] = useState<"all" | "borrowed" | "lent" | "repayment">("all")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)

  const { loading: transactionsLoading, execute: fetchTransactions } = useApi()
  const { mutate: createTransaction } = useApiMutation()
  const { mutate: updateTransaction } = useApiMutation()
  const { mutate: deleteTransactionMutation } = useApiMutation()

  // Memoized filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) =>
      activeFilter === "all" ? true : t.transactionType === activeFilter
    )
  }, [transactions, activeFilter])

  // Memoized totals calculation
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.transactionType === "borrowed") acc.borrowed += t.amount
        else if (t.transactionType === "lent") acc.lent += t.amount
        return acc
      },
      { borrowed: 0, lent: 0 }
    )
  }, [transactions])

  const netOutstanding = totals.borrowed - totals.lent

  useEffect(() => {
    loadTransactions()
  }, [])

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => setApiError(null), 8000)
      return () => clearTimeout(timer)
    }
  }, [apiError])

  const loadTransactions = async () => {
    try {
      setApiError(null)
      const data = await fetchTransactions("/api/money-transactions?limit=50")
      
      // Validate the response data
      const transactionsArray = Array.isArray(data.transactions) ? data.transactions : []
      const validatedTransactions = transactionsArray
      setTransactions(validatedTransactions)
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to load transactions"
      setApiError(errorMessage)
      console.error("Failed to load transactions:", error)
    }
  }

  const validateForm = (data: TransactionData): FormErrors => {
    const errors: FormErrors = {}

    try {
      TransactionDataSchema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          const fieldName = err.path.join(".")
          errors[fieldName] = err.message
        })
      }
    }

    // Additional business logic validation
    if (data.expectedReturnDate) {
      const returnDate = new Date(data.expectedReturnDate)
      const transactionDate = new Date(data.date)
      if (returnDate <= transactionDate) {
        errors.expectedReturnDate = "Expected return date must be after the transaction date"
      }
    }

    // Validate names based on transaction type
    if (data.transactionType === "borrowed" && !data.lenderName.trim()) {
      errors.lenderName = "Lender's name is required for borrowed transactions"
    }
    if (data.transactionType === "lent" && !data.borrowerName.trim()) {
      errors.borrowerName = "Borrower's name is required for lent transactions"
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setApiError(null)
    setSuccessMessage(null)
    
    // Validate form
    const errors = validateForm(formData)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      setApiError("Please fix the validation errors below")
      return
    }

    setIsSubmitting(true)
    
    try {
      const payload = {
        transactionType: formData.transactionType.toUpperCase(),
        date: formData.date,
        amount: Number(formData.amount),
        paymentMethod: formData.paymentMethod.toUpperCase().replace(' ', '_'),
        destination: formData.destination,
        personName: formData.transactionType === "borrowed" 
          ? formData.lenderName 
          : formData.borrowerName,
        contactInfo: formData.contactInfo || "",
        primaryPurpose: formData.primaryPurpose,
        expectedReturnDate: formData.expectedReturnDate || null,
        interestRate: Number(formData.interestRate || 0),
        interestType: formData.interestType.toUpperCase().replace(" ", "_"),
        status: formData.status.toUpperCase().replace("/", "_").replace(" ", "_"),
        detailedDescription: formData.detailedDescription || "",
        lenderName: formData.lenderName,
        borrowerName: formData.borrowerName,
      }

      if (editingTransaction) {
        await updateTransaction(`/api/money-transactions/${editingTransaction}`, { 
          method: 'PUT',
          body: payload 
        })
        setSuccessMessage("Transaction updated successfully!")
        setEditingTransaction(null)
      } else {
       const data = await createTransaction("/api/money-transactions", { body: payload })
        if (data.success) {
          toast.success(data.message || "Transaction created successfully!")
        }
        
      }

      // Reset form
      setFormData(getInitialFormData())
      
      
      // Reload transactions
      await loadTransactions()
      
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to save transaction"
      setApiError(`Failed to save transaction: ${errorMessage}`)
      console.error("Transaction save error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const editTransaction = (transaction: TransactionWithId) => {
    setFormData({
      transactionType: transaction.transactionType,
      date: transaction.date,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      destination: transaction.destination,
      contactInfo: transaction.contactInfo || "",
      primaryPurpose: transaction.primaryPurpose,
      expectedReturnDate: transaction.expectedReturnDate || "",
      interestRate: transaction.interestRate,
      interestType: transaction.interestType,
      status: transaction.status,
      detailedDescription: transaction.detailedDescription || "",
      lenderName: transaction.lenderName,
      borrowerName: transaction.borrowerName,
    })
    setEditingTransaction(transaction.id)
    setFormErrors({})
    setApiError(null)
    setSuccessMessage(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const cancelEdit = () => {
    setEditingTransaction(null)
    setFormData(getInitialFormData())
    setFormErrors({})
    setApiError(null)
  }

  const deleteTransaction = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return
    
    try {
      setApiError(null)
      await deleteTransactionMutation(`/api/money-transactions/${transactionId}`, { 
        method: 'DELETE' 
      })
      await loadTransactions()
      toast.success('Transaction deleted successfully!')
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to delete transaction"
      setApiError(errorMessage)
    }
  }

  const handleInputChange = (field: keyof TransactionData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const exportData = (format: 'pdf' | 'excel') => {
    const data = filteredTransactions.map((t) => ({
      date: new Date(t.date).toLocaleDateString("en-IN"),
      type: t.transactionType.charAt(0).toUpperCase() + t.transactionType.slice(1),
      lender: t.lenderName,
      borrower: t.borrowerName,
      amount: t.amount,
      purpose: t.primaryPurpose,
      status: t.status,
      paymentMethod: t.paymentMethod,
      contactInfo: t.contactInfo || "N/A",
      expectedReturnDate: t.expectedReturnDate
        ? new Date(t.expectedReturnDate).toLocaleDateString("en-IN")
        : "N/A",
      interestRate: t.interestRate,
      interestType: t.interestType,
      description: t.detailedDescription || "N/A",
    }))

    const exportConfig = {
      title: "Money Transactions Report",
      dateRange: `Generated on ${new Date().toLocaleDateString("en-IN")}`,
      columns: [
        "date", "type", "lender", "borrower", "amount", "purpose", "status",
        "paymentMethod", "contactInfo", "expectedReturnDate", "interestRate",
        "interestType", "description",
      ],
      data,
      columnLabels: [
        "Date", "Type", "Lender", "Borrower", "Amount", "Purpose", "Status",
        "Payment Method", "Contact Info", "Expected Return", "Interest Rate",
        "Interest Type", "Description",
      ],
      currencyColumns: ["amount", "interestRate"],
    }

    if (format === 'pdf') {
      exportToPDF({ ...exportConfig, orientation: "landscape" })
    } else {
      exportToExcel(exportConfig)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Money Management Tracker</h2>
        <p className="text-gray-600">
          Track borrowed money, lending, and money usage with detailed records
        </p>
      </div>

      {/* Error and Success Messages */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{apiError}</p>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="text-green-400">✅</div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Money Borrowed</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">
                ₹{totals.borrowed.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-lg sm:text-xl">📉</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Money Lent</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">
                ₹{totals.lent.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-lg sm:text-xl">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Net Outstanding</p>
              <p
                className={`text-lg sm:text-2xl font-bold ${
                  netOutstanding >= 0 ? "text-orange-600" : "text-green-600"
                }`}
              >
                ₹{Math.abs(netOutstanding).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 text-lg sm:text-xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Form */}
      <div className="bg-white rounded-lg card-shadow p-4 sm:p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">
            {editingTransaction ? "Edit Transaction" : "Add New Transaction"}
          </h3>
          {editingTransaction && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* Transaction Type Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {[
            { key: "borrowed", title: "Money Borrowed", sub: "We received money from someone" },
            { key: "lent", title: "Money Lent", sub: "We gave money to someone" },
            { key: "repayment", title: "Repayment", sub: "Returning borrowed money" },
          ].map((opt) => (
            <div 
              key={opt.key} 
              className={`border rounded-lg p-4 ${
                formData.transactionType === opt.key ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
            >
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="transactionType"
                  value={opt.key}
                  checked={formData.transactionType === (opt.key as any)}
                  onChange={(e) =>
                    handleInputChange("transactionType", e.target.value as TransactionData["transactionType"])
                  }
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">{opt.title}</div>
                  <div className="text-sm text-gray-500">{opt.sub}</div>
                </div>
              </label>
            </div>
          ))}
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className={`w-full px-3 py-2 border rounded-md input-focus ${
                  formErrors.date ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
              />
              {formErrors.date && (
                <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                className={`w-full px-3 py-2 border rounded-md input-focus ${
                  formErrors.amount ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.amount || ""}
                onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
                placeholder="0"
                step="0.01"
                min="0.01"
              />
              {formErrors.amount && (
                <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange("paymentMethod", e.target.value as TransactionData["paymentMethod"])}
              >
                {FORM_CONSTANTS.paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Names Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lender's Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className={`w-full px-3 py-2 border rounded-md input-focus ${
                  formErrors.lenderName ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.lenderName}
                onChange={(e) => handleInputChange("lenderName", e.target.value)}
                placeholder={
                  formData.transactionType === "borrowed"
                    ? "Name of person who lent us money"
                    : "Our name (we are the lender)"
                }
              />
              {formErrors.lenderName && (
                <p className="mt-1 text-sm text-red-600">{formErrors.lenderName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Borrower's Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className={`w-full px-3 py-2 border rounded-md input-focus ${
                  formErrors.borrowerName ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.borrowerName}
                onChange={(e) => handleInputChange("borrowerName", e.target.value)}
                placeholder={
                  formData.transactionType === "borrowed"
                    ? "Our name (we borrowed)"
                    : "Name of person who borrowed from us"
                }
              />
              {formErrors.borrowerName && (
                <p className="mt-1 text-sm text-red-600">{formErrors.borrowerName}</p>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.contactInfo}
                onChange={(e) => handleInputChange("contactInfo", e.target.value)}
                placeholder="Phone number or address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Purpose</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.primaryPurpose}
                onChange={(e) => handleInputChange("primaryPurpose", e.target.value as TransactionData["primaryPurpose"])}
              >
                {FORM_CONSTANTS.purposes.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purpose}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expected Return Date</label>
              <input
                type="date"
                className={`w-full px-3 py-2 border rounded-md input-focus ${
                  formErrors.expectedReturnDate ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.expectedReturnDate}
                onChange={(e) => handleInputChange("expectedReturnDate", e.target.value)}
                min={formData.date}
              />
              {formErrors.expectedReturnDate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.expectedReturnDate}</p>
              )}
            </div>
          </div>

          {/* Interest and Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
              <input
                type="number"
                className={`w-full px-3 py-2 border rounded-md input-focus ${
                  formErrors.interestRate ? "border-red-500" : "border-gray-300"
                }`}
                value={formData.interestRate || ""}
                onChange={(e) => handleInputChange("interestRate", parseFloat(e.target.value) || 0)}
                placeholder="0"
                step="0.1"
                min="0"
                max="100"
              />
              {formErrors.interestRate && (
                <p className="mt-1 text-sm text-red-600">{formErrors.interestRate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interest Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.interestType}
                onChange={(e) => handleInputChange("interestType", e.target.value as TransactionData["interestType"])}
              >
                {FORM_CONSTANTS.interestTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value as TransactionData["status"])}
              >
                {FORM_CONSTANTS.statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md input-focus"
              rows={4}
              value={formData.detailedDescription}
              onChange={(e) => handleInputChange("detailedDescription", e.target.value)}
              placeholder="Describe what this money was used for, any special terms, or additional notes..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting 
                ? (editingTransaction ? "Updating..." : "Saving...") 
                : (editingTransaction ? "Update Transaction" : "Save Transaction")
              }
            </button>
          </div>
        </form>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg card-shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <h3 className="text-lg font-semibold mb-2 sm:mb-0">Recent Transactions</h3>

          {filteredTransactions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-0">
              <button
                type="button"
                onClick={() => exportData('pdf')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              >
                📄 Download PDF
              </button>
              <button
                type="button"
                onClick={() => exportData('excel')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                📊 Download Excel
              </button>
            </div>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeFilter === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("borrowed")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeFilter === "borrowed"
                ? "bg-red-600 text-white"
                : "bg-red-100 text-red-800 hover:bg-red-200"
            }`}
          >
            Borrowed ({transactions.filter(t => t.transactionType === "borrowed").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("lent")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeFilter === "lent"
                ? "bg-blue-600 text-white"
                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
            }`}
          >
            Lent ({transactions.filter(t => t.transactionType === "lent").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("repayment")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeFilter === "repayment"
                ? "bg-green-600 text-white"
                : "bg-green-100 text-green-800 hover:bg-green-200"
            }`}
          >
            Repayments ({transactions.filter(t => t.transactionType === "repayment").length})
          </button>
        </div>

        {/* Loading State */}
        {transactionsLoading ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-500 bg-white">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading transactions...
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="text-lg font-bold text-blue-600">#{transaction.id.slice(-6)}</div>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.transactionType === "borrowed"
                            ? "bg-red-100 text-red-800"
                            : transaction.transactionType === "lent"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {transaction.transactionType.charAt(0).toUpperCase() +
                          transaction.transactionType.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="font-medium text-gray-500">Date</div>
                        <div className="font-semibold">
                          {new Date(transaction.date).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-500">Amount</div>
                        <div className="text-lg font-bold text-gray-900">
                          ₹{transaction.amount.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="font-medium text-gray-500 mb-1">Lender</div>
                      <div className="font-semibold text-gray-800">{transaction.lenderName}</div>
                    </div>

                    <div>
                      <div className="font-medium text-gray-500 mb-1">Borrower</div>
                      <div className="font-semibold text-gray-800">{transaction.borrowerName}</div>
                    </div>

                    <div>
                      <div className="font-medium text-gray-500 mb-1">Purpose</div>
                      <div className="font-semibold text-gray-800">{transaction.primaryPurpose}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="font-medium text-gray-500">Payment Method</div>
                        <div className="font-semibold">💳 {transaction.paymentMethod}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-500">Status</div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                            transaction.status.includes("ACTIVE") || transaction.status.includes("OUTSTANDING")
                              ? "bg-yellow-100 text-yellow-800"
                              : transaction.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.status.includes("ACTIVE") || transaction.status.includes("OUTSTANDING")
                            ? "⏳ Active"
                            : transaction.status === "COMPLETED"
                            ? "✅ Completed"
                            : "❌ " + transaction.status}
                        </span>
                      </div>
                    </div>

                    {transaction.contactInfo && (
                      <div>
                        <div className="font-medium text-gray-500 mb-1">Contact</div>
                        <div className="text-sm text-blue-600">📞 {transaction.contactInfo}</div>
                      </div>
                    )}

                    {transaction.expectedReturnDate && (
                      <div>
                        <div className="font-medium text-gray-500 mb-1">Expected Return</div>
                        <div className="text-sm text-gray-600">
                          📅 {new Date(transaction.expectedReturnDate).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                    )}

                    {transaction.interestRate > 0 && (
                      <div>
                        <div className="font-medium text-gray-500 mb-1">Interest</div>
                        <div className="text-sm text-gray-600">
                          💹 {transaction.interestRate}% {transaction.interestType}
                        </div>
                      </div>
                    )}

                    {transaction.detailedDescription && (
                      <div>
                        <div className="font-medium text-gray-500 mb-1">Description</div>
                        <div className="text-sm text-gray-600">{transaction.detailedDescription}</div>
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => editTransaction(transaction)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTransaction(transaction.id)}
                        className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-6xl mb-4">💸</div>
                  <div className="text-lg font-medium mb-2">No Transactions Found</div>
                  <div className="text-sm">
                    {activeFilter === "all" 
                      ? "Start by adding your first transaction above."
                      : `No ${activeFilter} transactions found. Try a different filter.`
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lender
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Borrower
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.slice(0, 10).map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              transaction.transactionType === "borrowed"
                                ? "bg-red-100 text-red-800"
                                : transaction.transactionType === "lent"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {transaction.transactionType.charAt(0).toUpperCase() +
                              transaction.transactionType.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">{transaction.lenderName}</div>
                          {transaction.contactInfo && (
                            <div className="text-xs text-gray-500">{transaction.contactInfo}</div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">{transaction.borrowerName}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{transaction.amount.toLocaleString("en-IN")}
                          {transaction.interestRate > 0 && (
                            <div className="text-xs text-gray-500">
                              {transaction.interestRate}% {transaction.interestType}
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{transaction.primaryPurpose}</div>
                          <div className="text-xs text-gray-500">{transaction.paymentMethod}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.status.includes("ACTIVE") || transaction.status.includes("OUTSTANDING")
                                ? "bg-yellow-100 text-yellow-800"
                                : transaction.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {transaction.status}
                          </span>
                          {transaction.expectedReturnDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              Due: {new Date(transaction.expectedReturnDate).toLocaleDateString("en-IN")}
                            </div>
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            type="button"
                            onClick={() => editTransaction(transaction)}
                            className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                            title="Edit transaction"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTransaction(transaction.id)}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                            title="Delete transaction"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-3 sm:px-6 py-12 text-center text-sm text-gray-500">
                        <div className="flex flex-col items-center">
                          <div className="text-6xl mb-4">💸</div>
                          <div className="text-lg font-medium mb-2">No Transactions Found</div>
                          <div className="text-sm">
                            {activeFilter === "all" 
                              ? "Start by adding your first transaction above."
                              : `No ${activeFilter} transactions found. Try a different filter.`
                            }
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Info */}
            {filteredTransactions.length > 10 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing 10 of {filteredTransactions.length} transactions
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
