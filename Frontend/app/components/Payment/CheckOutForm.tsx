import { styles } from "@/app/styles/style";
import { useCreateOrderMutation } from "@/redux/features/orders/ordersApi";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { getSocket } from "@/app/utils/socketConfig";

type Props = {
  setOpen: any;
  data: any;
  user: any;
  refetch: any;
};

const CheckOutForm = ({ setOpen, data, user, refetch }: Props) => {
  const [message, setMessage] = useState<any>("");
  const [createOrder, { data: orderData, error }] = useCreateOrderMutation();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Display "processing payment" status
    setIsLoading(true);
    setMessage("Processing payment, please wait...");
    
    // Create mock payment_info to simulate successful payment
    const mockPaymentInfo = {
      id: `pay_${Math.random().toString(36).substring(2, 15)}`,
      amount: data.price * 100,
      status: "succeeded",
      created: Date.now() / 1000,
      currency: "usd",
      payment_method: paymentMethod,
      payment_method_types: [paymentMethod],
    };
    
    // Simulate network delay (2-4 seconds)
    const randomDelay = Math.floor(Math.random() * 2000) + 2000;
    
    // We're simulating the API call, not actually making it
    setTimeout(() => {
      // Call the createOrder API with mock data
      createOrder({ courseId: data._id, payment_info: mockPaymentInfo });
      
      // Show success message
      setMessage("Payment successful! Redirecting...");
      
      // Close modal after 1 second
      setTimeout(() => {
        setOpen(false);
      }, 1000);
    }, randomDelay);
  };

  useEffect(() => {
    if (orderData) {
      refetch();
      const socket = getSocket();
      socket.emit("notification", {
        title: "New Order",
        message: `You have a new order from ${data.name}`,
        userId: user._id,
      });
      redirect(`/course-access/${data._id}`);
    }
    if (error) {
      if ("data" in error) {
        const errorMessage = error as any;
        toast.error(errorMessage.data.message);
      }
    }
  }, [orderData, error]);

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Course Payment</h2>
        <p className="mb-4 text-black dark:text-white">Course: <span className="font-semibold">{data.name}</span></p>
        <p className="mb-4 text-black dark:text-white">Price: <span className="font-semibold">${data.price}</span></p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-black dark:text-white">Payment Method</label>
          <div className="flex flex-col space-y-2">
            <label className="flex items-center space-x-2 p-3 border dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="paymentMethod"
                value="credit_card"
                checked={paymentMethod === "credit_card"}
                onChange={() => setPaymentMethod("credit_card")}
                className="h-4 w-4"
              />
              <span className="text-black dark:text-white">Credit / Debit Card</span>
            </label>
            
            <label className="flex items-center space-x-2 p-3 border dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="paymentMethod"
                value="bank_transfer"
                checked={paymentMethod === "bank_transfer"}
                onChange={() => setPaymentMethod("bank_transfer")}
                className="h-4 w-4"
              />
              <span className="text-black dark:text-white">Bank Transfer</span>
            </label>
            
            <label className="flex items-center space-x-2 p-3 border dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="radio"
                name="paymentMethod"
                value="e_wallet"
                checked={paymentMethod === "e_wallet"}
                onChange={() => setPaymentMethod("e_wallet")}
                className="h-4 w-4"
              />
              <span className="text-black dark:text-white">E-Wallet</span>
            </label>
          </div>
        </div>
        
        {paymentMethod === "credit_card" && (
          <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-800">
            <div className="mb-3">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Card Number</label>
              <div className="h-10 rounded bg-gray-100 dark:bg-gray-700 px-3 flex items-center text-black dark:text-white">
                **** **** **** 4242
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Expiration Date</label>
                <div className="h-10 rounded bg-gray-100 dark:bg-gray-700 px-3 flex items-center text-black dark:text-white">
                  12/25
                </div>
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">CVC</label>
                <div className="h-10 rounded bg-gray-100 dark:bg-gray-700 px-3 flex items-center text-black dark:text-white">
                  ***
                </div>
              </div>
            </div>
          </div>
        )}
        
        {paymentMethod === "bank_transfer" && (
          <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-800">
            <p className="text-sm mb-2 text-black dark:text-white">Bank Transfer Information:</p>
            <p className="text-sm text-black dark:text-white">Bank: <span className="font-semibold">ACB</span></p>
            <p className="text-sm text-black dark:text-white">Account Number: <span className="font-semibold">29474987</span></p>
            <p className="text-sm text-black dark:text-white">Account Holder: <span className="font-semibold">LE THANH HIEU</span></p>
            <p className="text-sm mt-2 text-black dark:text-white">Amount: <span className="font-semibold">{Math.round(data.price * 26005).toLocaleString()} VND</span></p>
            <p className="text-sm text-black dark:text-white">Reference: <span className="font-semibold">Payment for {data.name}</span></p>
          </div>
        )}
        
        {paymentMethod === "e_wallet" && (
          <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-800">
            <p className="text-sm mb-2 text-black dark:text-white">Scan QR Code to pay:</p>
            {/* Tạo QR code động dựa trên giá khóa học, quy đổi từ USD sang VND với tỷ giá 26005 */}
            <div className="w-full flex justify-center my-4">
              <img 
                src={`https://img.vietqr.io/image/ACB-29474987-compact2.jpg?amount=${Math.round(data.price * 26005)}&addInfo=Payment for ${data.name}&accountName=LE%20THANH%20HIEU`}
                alt="QR Payment Code"
                className="max-w-full h-auto rounded-md shadow-md"
              />
            </div>
            <p className="text-sm mt-2 text-black dark:text-white">Amount: <span className="font-semibold">{Math.round(data.price * 26005).toLocaleString()} VND</span></p>
            <p className="text-sm text-black dark:text-white">Bank: <span className="font-semibold">ACB</span></p>
            <p className="text-sm text-black dark:text-white">Account Number: <span className="font-semibold">29474987</span></p>
            <p className="text-sm text-black dark:text-white">Account Holder: <span className="font-semibold">LE THANH HIEU</span></p>
          </div>
        )}
      </div>
      
      <button disabled={isLoading} id="submit" className="w-full">
        <span id="button-text" className={`${styles.button} mt-2 !h-[45px] w-full flex items-center justify-center`}>
          {isLoading ? "Processing..." : "Pay $" + data.price}
        </span>
      </button>
      
      {/* Show any error or success messages */}
      {message && (
        <div id="payment-message" className={`font-Poppins text-center pt-4 ${message.includes("successful") ? "text-green-500" : "text-red-500 dark:text-red-400"}`}>
          {message}
        </div>
      )}
    </form>
  );
};

export default CheckOutForm;